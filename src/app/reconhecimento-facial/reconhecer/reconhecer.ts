import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { Subject } from 'rxjs';
import * as faceapi from 'face-api.js';
import { ServiceEnviar } from '../../Comunicacao-com-backend/service-enviar';
import { Router } from '@angular/router';
import { ServicesBuscar } from '../../Comunicacao-com-backend/services-buscar';

@Component({
  selector: 'app-reconhecer',
  standalone: true,
  imports: [CommonModule, WebcamModule],
  templateUrl: './reconhecer.html',
  styleUrls: ['./reconhecer.css']
})
export class Reconhecer implements OnInit {
  // Controle de telas
  aparecer: boolean = false;   // false = tela de selfie inicial; true = tela de liveness

  // Dados da selfie e BI
  selfieImage: WebcamImage | null = null;
  fotoBI: string | null = null;          // imagem da frente do BI (base64)
  fotoAcomparar: Float32Array | null = null; // descritor facial da selfie aprovada

  // Status de aprovação
  aprovado: boolean = false;
  resultado: string = "";

  // Variáveis para o liveness
  intervalLiveness: any = null;
  timeoutLiveness: any = null;
  cheksrealizados: Set<string> = new Set();   // movimentos realizados
  livenessPassed: boolean = false;
  instrucoesAtual: string = 'Clique no botão para iniciar a prova de vida!';
  livenessStatus: string = '';
  iconeAtual: string = 'touch_app';          // ícone exibido no template

  // Subjects para acionar a câmera
  trigger = new Subject<void>();
  triggerObservable = this.trigger.asObservable();
  triggerLiveness = new Subject<void>();
  triggerLivenessObservable = this.triggerLiveness.asObservable();

  constructor(
    private dadosService: ServiceEnviar,
    private router: Router,
    private buscar: ServicesBuscar
  ) {}

  async ngOnInit() {
    // Carrega os modelos do face-api.js
    await faceapi.tf.setBackend('cpu');
    await faceapi.tf.ready();

    const MODEL_URL = 'https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js/weights';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

    // Recupera a imagem da frente do BI (salva pelo componente Cnebi)
    this.dadosService.imagemFrente$.subscribe(img => {
      if (img) {
        this.fotoBI = img;
        console.log('Imagem do BI carregada no reconhecimento');
      } else {
        console.warn('Nenhuma imagem do BI encontrada. Volte e capture o BI.');
      }
    });
  }

  // ------------------------------------------------------------------
  // 1ª ETAPA: Tirar selfie e comparar com a foto do BI
  // ------------------------------------------------------------------
  tirarSelfie() {
    this.trigger.next();   // aciona a captura da webcam
  }

  async minhaSelfie(imagem: WebcamImage) {
    if (!this.fotoBI) {
      this.resultado = '❌ Nenhuma foto do BI para comparar. Refaça o processo.';
      return;
    }

    this.selfieImage = imagem;

    const biImg = new Image();
    biImg.src = this.fotoBI;
    const selfieImg = new Image();
    selfieImg.src = this.selfieImage.imageAsDataUrl;

    await Promise.all([biImg.decode(), selfieImg.decode()]);

    const descricaoBI = await faceapi.detectSingleFace(biImg)
      .withFaceLandmarks()
      .withFaceDescriptor();
    const descricaoSelfie = await faceapi.detectSingleFace(selfieImg)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (descricaoBI && descricaoSelfie) {
      const distancia = faceapi.euclideanDistance(descricaoBI.descriptor, descricaoSelfie.descriptor);
      if (distancia < 0.6) {
        this.aprovado = true;
        this.resultado = `✅ Reconhecimento facial aprovado! Distância: ${distancia.toFixed(4)}`;
        this.fotoAcomparar = descricaoSelfie.descriptor;   // guarda o descritor para o liveness
        this.aparecer = true;   // avança para a tela de liveness
      } else {
        this.aprovado = false;
        this.resultado = `❌ Reconhecimento facial reprovado! Distância: ${distancia.toFixed(4)}`;
        this.router.navigate(['/Cnebi']);
      }
    } else {
      this.resultado = '❌ Não foi possível detectar rosto em uma das imagens. Tente novamente.';
    }
  }

  // ------------------------------------------------------------------
  // 2ª ETAPA: Liveness (prova de vida)
  // ------------------------------------------------------------------
  IniciarLiveness() {
    if (!this.fotoAcomparar) {
      this.livenessStatus = '❌ Selfie não aprovada. Refaça o reconhecimento.';
      return;
    }
    this.livenessPassed = false;
    this.cheksrealizados.clear();
    this.instrucoesAtual = 'Pisca os olhos (fechar e abrir)';
    this.iconeAtual = 'visibility';
    this.livenessStatus = 'A verificar...';

    if (this.intervalLiveness) clearInterval(this.intervalLiveness);
    this.intervalLiveness = setInterval(() => {
      this.triggerLiveness.next();   // captura um frame a cada 500ms
    }, 500);

    // Tempo máximo de 2 minutos
    this.timeoutLiveness = setTimeout(() => {
      if (!this.livenessPassed) {
        clearInterval(this.intervalLiveness);
        this.livenessStatus = '⏰ Tempo esgotado. Tenta novamente.';
        this.instrucoesAtual = 'Clique no botão para iniciar a prova de vida!';
      }
    }, 120000);
  }

  pararLiveness() {
    if (this.intervalLiveness) clearInterval(this.intervalLiveness);
    if (this.timeoutLiveness) clearTimeout(this.timeoutLiveness);
    this.instrucoesAtual = 'Clique no botão para iniciar a prova de vida!';
    this.livenessStatus = 'Liveness parado.';
  }

  async framesCapturada(imagem: WebcamImage) {
    if (this.livenessPassed) return;
    if (!this.fotoAcomparar) return;

    const img = new Image();
    img.src = imagem.imageAsDataUrl;
    await img.decode();

    const deteccao = await faceapi.detectSingleFace(img, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!deteccao) {
      console.log('Nenhum rosto detectado no frame');
      return;
    }

    // Verifica se o rosto ainda corresponde ao da selfie aprovada
    const distancia = faceapi.euclideanDistance(deteccao.descriptor, this.fotoAcomparar);
    if (distancia > 0.65) {
      console.log(`Rosto não corresponde ao BI. Distância: ${distancia.toFixed(4)}`);
      this.pararLiveness();
      this.livenessStatus = '❌ Rosto não corresponde ao do BI. Tenta novamente.';
      this.instrucoesAtual = 'Clique no botão para reiniciar.';
      return;
    }

    const pontos = deteccao.landmarks;

    // --- Passo 1: Piscar os olhos ---
    if (!this.cheksrealizados.has('piscar')) {
      const olhoEsquerdo = Math.abs(pontos.getLeftEye()[1].y - pontos.getLeftEye()[4].y);
      const olhoDireito = Math.abs(pontos.getRightEye()[1].y - pontos.getRightEye()[4].y);
      if (olhoEsquerdo < 12 && olhoDireito < 12) {
        this.cheksrealizados.add('piscar');
        this.instrucoesAtual = 'Agora vira a cabeça para a esquerda';
        this.livenessStatus = '✅ Piscada detectada! ✓';
        this.iconeAtual = 'arrow_back';
      }
      return;
    }

    // --- Passo 2: Virar a cabeça para a esquerda ---
    if (!this.cheksrealizados.has('esquerda') && this.cheksrealizados.has('piscar')) {
      const narizX = pontos.getNose()[0].x;
      const narizEsquerda = pontos.getJawOutline()[0].x;
      if (narizX - narizEsquerda > 30) {
        this.cheksrealizados.add('esquerda');
        this.instrucoesAtual = 'Agora vire para a direita';
        this.livenessStatus += ' | Esquerda detectada! ✓';
        this.iconeAtual = 'arrow_forward';
      }
      return;
    }

    // --- Passo 3: Virar a cabeça para a direita ---
    if (!this.cheksrealizados.has('direita') && this.cheksrealizados.has('esquerda')) {
      const narizX = pontos.getNose()[0].x;
      const narizDireita = pontos.getJawOutline()[16].x;
      if (narizDireita - narizX > 30) {
        this.cheksrealizados.add('direita');
        this.instrucoesAtual = '✅ Parabéns, passaste pelo liveness!';
        this.livenessStatus += ' | Direita detectada! ✓';
        this.iconeAtual = 'check_circle';
        this.livenessPassed = true;
        clearInterval(this.intervalLiveness);
        clearTimeout(this.timeoutLiveness);

        // Envia KYC para o backend e redireciona
        this.buscar.enviarKYC(true).subscribe({
          next: () => {
            this.buscar.mostrarPerfil();
            this.router.navigate(['/cadastrowebauth']);
          },
          error: (err) => {
            console.error('Erro ao enviar KYC', err);
            this.livenessStatus = '❌ Erro ao concluir verificação. Tente novamente.';
          }
        });
      }
    }
  }
}
