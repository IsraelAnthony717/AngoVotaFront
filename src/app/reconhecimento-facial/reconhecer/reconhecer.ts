import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { WebcamModule, WebcamImage, WebcamInitError, WebcamUtil } from 'ngx-webcam';

@Component({
  selector: 'app-reconhecer',
  standalone: true,
  imports: [CommonModule, WebcamModule],
  templateUrl: './reconhecer.html',
  styleUrls: ['./reconhecer.css']
})
export class Reconhecer implements OnInit, OnDestroy {
  aparecer = false;

  private triggerSubject = new Subject<void>();
  triggerObservable = this.triggerSubject.asObservable();

  private triggerLivenessSubject = new Subject<void>();
  triggerLivenessObservable = this.triggerLivenessSubject.asObservable();

  iconeAtual = 'face';
  instrucoesAtual = '';
  livenessStatus = '';
  livenessPassed = false;

  erros: string[] = [];

  ngOnInit() {
    this.verificarCamera();
  }

  ngOnDestroy() {
    // cleanup
  }

  async verificarCamera() {
    try {
      const devices = await WebcamUtil.getAvailableVideoInputs();
      if (!devices || devices.length === 0) {
        this.adicionarErro('Nenhuma câmera encontrada.');
      } else {
        this.adicionarErro('✅ Câmera disponível. Aguarde permissão.');
      }
    } catch (err) {
      this.adicionarErro('Erro ao listar câmeras: ' + err);
    }
  }

  onWebcamError(error: WebcamInitError) {
    console.error(error);
    this.adicionarErro(`Erro da câmera: ${error.message}`);
  }

  onWebcamInit() {
    console.log('Webcam pronta');
    this.adicionarErro('✅ Webcam inicializada');
  }

  tirarSelfie() {
    this.triggerSubject.next();
  }

  minhaSelfie(event: WebcamImage) {
    console.log('Selfie', event);
    this.adicionarErro(`📸 Selfie capturada às ${new Date().toLocaleTimeString()}`);
    // enviar para backend...
  }

  IniciarLiveness() {
    this.aparecer = true;
    this.livenessStatus = '';
    this.livenessPassed = false;
    this.triggerLivenessSubject.next();
    this.adicionarErro('🟢 Modo liveness ativado');
  }

  pararLiveness() {
    this.aparecer = false;
    this.livenessStatus = '';
    this.adicionarErro('🔴 Modo liveness desativado');
  }

  framesCapturada(event: WebcamImage) {
    console.log('Frame recebido');
    if (!this.livenessStatus) {
      this.livenessStatus = 'Analisando...';
    }
  }

  private adicionarErro(mensagem: string) {
    this.erros.unshift(mensagem);
    if (this.erros.length > 10) this.erros.pop();
    console.warn(mensagem);
  }

  limparErros() {
    this.erros = [];
  }
}
