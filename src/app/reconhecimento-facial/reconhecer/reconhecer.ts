import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  aparecer: boolean = false;
  selfieImage: WebcamImage | null = null;
  fotoBI: string | null = null;
  fotoAcomparar: Float32Array | null = null;
  aprovado: boolean = false;
  resultado: string = "";

  intervalLiveness: any = null;
  timeoutLiveness: any = null;
  cheksrealizados: Set<string> = new Set();
  livenessPassed: boolean = false;
  instrucoesAtual: string = 'Clique no botão para iniciar a prova de vida!';
  livenessStatus: string = '';
  iconeAtual: string = 'touch_app';

  trigger = new Subject<void>();
  triggerObservable = this.trigger.asObservable();
  triggerLiveness = new Subject<void>();
  triggerLivenessObservable = this.triggerLiveness.asObservable();

  constructor(
    private dadosService: ServiceEnviar,
    private router: Router,
    private buscar: ServicesBuscar,
    private cdr: ChangeDetectorRef   // 👈 para forçar atualização da UI
  ) {}

  async ngOnInit() {
    await faceapi.tf.setBackend('cpu');
    await faceapi.tf.ready();

    const MODEL_URL = 'https://cdn.jsdelivr.net/gh/cgarciagl/face-api.js/weights';
    await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

    this.dadosService.imagemFrente$.subscribe(img => {
      if (img) {
        this.fotoBI = img;
        console.log('Imagem do BI carregada');
      } else {
        console.warn('Nenhuma imagem do BI encontrada');
      }
    });
  }

  tirarSelfie() {
    this.trigger.next();
  }

  async minhaSelfie(imagem: WebcamImage) {
    if (!this.fotoBI) {
      this.resultado = '❌ Nenhuma foto do BI para comparar.';
      return;
    }

    this.selfieImage = imagem;
    const biImg = new Image();
    biImg.src = this.fotoBI;
    const selfieImg = new Image();
    selfieImg.src = this.selfieImage.imageAsDataUrl;
    await Promise.all([biImg.decode(), selfieImg.decode()]);

    const descricaoBI = await faceapi.detectSingleFace(biImg).withFaceLandmarks().withFaceDescriptor();
    const descricaoSelfie = await faceapi.detectSingleFace(selfieImg).withFaceLandmarks().withFaceDescriptor();

    if (descricaoBI && descricaoSelfie) {
      const distancia = faceapi.euclideanDistance(descricaoBI.descriptor, descricaoSelfie.descriptor);
      if (distancia < 0.6) {
        this.aprovado = true;
        this.resultado = `✅ Reconhecimento aprovado! Distância: ${distancia.toFixed(4)}`;
        this.fotoAcomparar = descricaoSelfie.descriptor;
        this.aparecer = true;
        this.cdr.detectChanges();
      } else {
        this.aprovado = false;
        this.resultado = `❌ Reconhecimento reprovado! Distância: ${distancia.toFixed(4)}`;
        this.router.navigate(['/Cnebi']);
      }
    } else {
      this.resultado = '❌ Não foi possível detectar rosto em uma das imagens.';
    }
  }

  IniciarLiveness() {
    if (!this.fotoAcomparar) {
      this.livenessStatus = '❌ Selfie não aprovada. Refaça o reconhecimento.';
      this.cdr.detectChanges();
      return;
    }
    this.livenessPassed = false;
    this.cheksrealizados.clear();
    this.instrucoesAtual = 'Pisca os olhos (fechar e abrir)';
    this.iconeAtual = 'visibility';
    this.livenessStatus = 'A verificar...';
    this.cdr.detectChanges();

    if (this.intervalLiveness) clearInterval(this.intervalLiveness);
    this.intervalLiveness = setInterval(() => {
      this.triggerLiveness.next();
    }, 500);

    this.timeoutLiveness = setTimeout(() => {
      if (!this.livenessPassed) {
        clearInterval(this.intervalLiveness);
        this.livenessStatus = '⏰ Tempo esgotado. Tenta novamente.';
        this.instrucoesAtual = 'Clique no botão para iniciar a prova de vida!';
        this.cdr.detectChanges();
      }
    }, 120000);
  }

  pararLiveness() {
    if (this.intervalLiveness) clearInterval(this.intervalLiveness);
    if (this.timeoutLiveness) clearTimeout(this.timeoutLiveness);
    this.instrucoesAtual = 'Clique no botão para iniciar a prova de vida!';
    this.livenessStatus = 'Liveness parado.';
    this.cdr.detectChanges();
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
      console.log('Nenhum rosto detectado');
      return;
    }

    const distancia = faceapi.euclideanDistance(deteccao.descriptor, this.fotoAcomparar);
    if (distancia > 0.65) {
      console.log(`Rosto não corresponde. Distância: ${distancia.toFixed(4)}`);
      this.pararLiveness();
      this.livenessStatus = '❌ Rosto não corresponde ao do BI. Tenta novamente.';
      this.instrucoesAtual = 'Clique no botão para reiniciar.';
      this.cdr.detectChanges();
      return;
    }

    const pontos = deteccao.landmarks;

    // --- Piscar (olhos) ---
    if (!this.cheksrealizados.has('piscar')) {
      const olhoEsquerdo = Math.abs(pontos.getLeftEye()[1].y - pontos.getLeftEye()[4].y);
      const olhoDireito = Math.abs(pontos.getRightEye()[1].y - pontos.getRightEye()[4].y);
      console.log(`Altura olhos - E: ${olhoEsquerdo.toFixed(2)} D: ${olhoDireito.toFixed(2)}`);
      if (olhoEsquerdo < 12 && olhoDireito < 12) {
        this.cheksrealizados.add('piscar');
        this.instrucoesAtual = 'Agora vira a cabeça para a esquerda';
        this.livenessStatus = '✅ Piscada detectada! ✓';
        this.iconeAtual = 'arrow_back';
        this.cdr.detectChanges();
      }
      return;
    }

    // --- Virar à esquerda ---
    if (!this.cheksrealizados.has('esquerda')) {
      const narizX = pontos.getNose()[0].x;
      const narizEsquerda = pontos.getJawOutline()[0].x;
      const diffEsq = narizX - narizEsquerda;
      console.log(`Diferença esquerda: ${diffEsq.toFixed(2)}`);
      if (diffEsq > 30) {
        this.cheksrealizados.add('esquerda');
        this.instrucoesAtual = 'Agora vire para a direita';
        this.livenessStatus += ' | Esquerda detectada! ✓';
        this.iconeAtual = 'arrow_forward';
        this.cdr.detectChanges();
      }
      return;
    }

    // --- Virar à direita ---
    if (!this.cheksrealizados.has('direita')) {
      const narizX = pontos.getNose()[0].x;
      const narizDireita = pontos.getJawOutline()[16].x;
      const diffDir = narizDireita - narizX;
      console.log(`Diferença direita: ${diffDir.toFixed(2)}`);
      if (diffDir > 30) {
        this.cheksrealizados.add('direita');
        this.instrucoesAtual = '✅ Parabéns, passaste pelo liveness!';
        this.livenessStatus += ' | Direita detectada! ✓';
        this.iconeAtual = 'check_circle';
        this.livenessPassed = true;
        clearInterval(this.intervalLiveness);
        clearTimeout(this.timeoutLiveness);
        this.cdr.detectChanges();

        this.buscar.enviarKYC(true).subscribe({
          next: () => {
            this.buscar.mostrarPerfil();
            this.router.navigate(['/cadastrowebauth']);
          },
          error: (err) => {
            console.error('Erro ao enviar KYC', err);
            this.livenessStatus = '❌ Erro ao concluir verificação. Tente novamente.';
            this.cdr.detectChanges();
          }
        });
      }
    }
  }
}
