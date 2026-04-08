import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { WebcamImage, WebcamModule } from 'ngx-webcam';
import { Subject, of } from 'rxjs';
import { timeout, catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
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
  aparecer: boolean = false;   // false = captura selfie, true = liveness
  selfieImage: WebcamImage | null = null;
  fotoBI: string | null = null;          // imagem da frente do BI (base64)
  fotoAcomparar: Float32Array | null = null; // descritor facial da selfie aprovada
  aprovado: boolean = false;
  resultado: string = "";

  // Variáveis para o liveness
  intervalLiveness: any = null;
  timeoutLiveness: any = null;
  cheksrealizados: Set<string> = new Set();
  livenessPassed: boolean = false;
  instrucoesAtual: string = 'Clique no botão para iniciar a prova de vida!';
  livenessStatus: string = '';
  iconeAtual: string = 'touch_app';

  // Subjects para acionar a câmera
  trigger = new Subject<void>();
  triggerObservable = this.trigger.asObservable();
  triggerLiveness = new Subject<void>();
  triggerLivenessObservable = this.triggerLiveness.asObservable();

  constructor(
    private dadosService: ServiceEnviar,
    private router: Router,
    private buscar: ServicesBuscar,
    private cdr: ChangeDetectorRef
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
    this.trigger.next();
  }

  async minhaSelfie(imagem: WebcamImage) {
    if (!this.fotoBI) {
      this.resultado = '❌ Nenhuma foto do BI para comparar. Refaça o processo.';
      this.cdr.detectChanges();
      return;
    }

    this.selfieImage = imagem;
    this.resultado = '📤 Enviando selfie para análise...';
    this.cdr.detectChanges();

    // Chama o backend para fazer a comparação facial (ou usa face-api local)
    // Ajuste a URL conforme seu backend
    this.buscar.enviarSelfie(imagem.imageAsDataUrl)
      .pipe(
        timeout(15000), // 15 segundos máximo
        catchError((err: HttpErrorResponse) => {
          console.error('Erro no reconhecimento:', err);
          let erroMsg = '❌ Falha na análise. ';
          if (err.status === 0) erroMsg += 'Sem conexão com o servidor.';
          else if (err.status === 500) erroMsg += 'Erro interno no servidor.';
          else erroMsg += `Código ${err.status}.`;
          this.resultado = erroMsg;
          this.cdr.detectChanges();
          // NÃO redireciona para o BI
          return of(null);
        })
      )
      .subscribe({
        next: (res) => {
          if (res) {
            console.log('Resposta do backend:', res);
            const distancia = res.distancia || 0.5;
            if (res.success && distancia < 0.6) {
              this.aprovado = true;
              this.resultado = `✅ Reconhecimento aprovado! Distância: ${distancia.toFixed(4)}`;
              this.fotoAcomparar = null; // se não usar descritor, apenas avança
              this.aparecer = true;       // avança para o liveness
            } else {
              this.resultado = `❌ Reconhecimento reprovado! Distância: ${distancia.toFixed(4)}`;
              // Permanece na mesma tela
            }
          }
          this.cdr.detectChanges();
        }
      });
  }

  // ------------------------------------------------------------------
  // 2ª ETAPA: Liveness (prova de vida)
  // ------------------------------------------------------------------
  IniciarLiveness() {
    if (!this.fotoAcomparar && this.aprovado) {
      // Se a comparação facial já foi feita, podemos usar a selfie atual
      this.fotoAcomparar = new Float32Array(128); // placeholder
    }
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

    // Verifica se o rosto ainda corresponde ao da selfie aprovada
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

        // Envia KYC para o backend e redireciona
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

  // Utilitário para converter base64 para Blob (se necessário)
  private dataURLtoBlob(dataURL: string): Blob {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  }
}
