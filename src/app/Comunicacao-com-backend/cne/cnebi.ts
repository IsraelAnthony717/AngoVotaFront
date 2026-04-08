import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ServiceEnviar } from '../service-enviar';
import { Router } from '@angular/router';

type Step = 'front' | 'back';

@Component({
  selector: 'app-cnebi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cnebi.html',
  styleUrls: ['./cnebi.css']
})
export class Cnebi implements AfterViewInit, OnDestroy {
  @ViewChild('video') video!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;

  stream!: MediaStream;
  step: Step = 'front';
  frontImage: string | null = null;
  backImage: string | null = null;
  statusMsg: string = "";
  enviando: boolean = false;
  debugInfo: string = ""; // para exibir detalhes do erro

  constructor(private serviceEnviar: ServiceEnviar, private rota: Router) {}

  async ngAfterViewInit() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } }
      });
      this.video.nativeElement.srcObject = this.stream;
    } catch (err) {
      this.statusMsg = "❌ Erro ao acessar a câmera. Verifique as permissões.";
      console.error(err);
    }
  }

  async capture() {
  const video = this.video.nativeElement;
  const canvas = this.canvas.nativeElement;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  // Compressão imediata
  const compressed = await this.compressImage(canvas.toDataURL('image/jpeg', 0.8), 600, 0.6);

  if (this.step === 'front') {
    this.frontImage = compressed;
    this.serviceEnviar.setImagemFrente(compressed); // 👈 SALVA A IMAGEM
    this.statusMsg = "✅ Frente capturada. Agora tire a foto do verso.";
    this.step = 'back';
  } else {
    this.backImage = compressed;
    this.statusMsg = "✅ Verso capturado. Clique em 'Confirmar e Enviar'.";
    this.stopCamera();
  }
}

  // Compressão forte: reduz resolução e qualidade
  private compressImage(base64: string, maxWidth: number = 500, quality: number = 0.5): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx!.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = base64;
    });
  }

  async confirmarEnvio() {
    if (!this.frontImage || !this.backImage) {
      this.statusMsg = "⚠️ Capture ambas as faces do documento primeiro.";
      return;
    }
    this.enviando = true;
    this.statusMsg = "📤 Enviando imagens...";
    this.debugInfo = "";

    try {
      // Reforça a compressão antes do envio (garantia)
      const frenteComp = await this.compressImage(this.frontImage, 500, 0.4);
      const versoComp = await this.compressImage(this.backImage, 500, 0.4);

      this.serviceEnviar.enviarDocumentos(frenteComp, versoComp).subscribe({
        next: (res) => {
          this.enviando = false;
          console.log('Resposta do backend:', res);
          if (res.dados) {
            this.serviceEnviar.setDocumento(res.dados);
          }
          this.statusMsg = "✅ Documento validado! Redirecionando...";
          setTimeout(() => {
            this.rota.navigate(['/reconhecimento']);
          }, 1000);
        },
        error: (err) => {
          this.enviando = false;
          console.error('Erro completo:', err);
          let msg = "❌ Erro ao validar documento. ";
          if (err.status === 413) msg += "Imagem muito grande. Tente capturar de mais perto.";
          else if (err.status === 404) msg += "Serviço indisponível.";
          else if (err.status === 500) msg += "Erro interno no servidor.";
          else msg += `Código ${err.status}. Verifique o console.`;
          this.statusMsg = msg;
          // Exibe detalhes técnicos para debug
          this.debugInfo = `Status: ${err.status} - ${err.message || err.statusText}`;
          if (err.error) this.debugInfo += ` | Detalhe: ${err.error}`;
        }
      });
    } catch (err) {
      this.enviando = false;
      this.statusMsg = "❌ Erro ao processar as imagens.";
      this.debugInfo = String(err);
      console.error(err);
    }
  }

  stopCamera() {
    this.stream?.getTracks().forEach(track => track.stop());
  }

  ngOnDestroy() {
    this.stopCamera();
  }
}
