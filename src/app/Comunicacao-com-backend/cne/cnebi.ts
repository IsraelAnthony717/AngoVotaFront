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

  constructor(private serviceEnviar: ServiceEnviar, private rota: Router) {}

  async ngAfterViewInit() {
    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } }
    });
    this.video.nativeElement.srcObject = this.stream;
  }

  async capture() {
  const video = this.video.nativeElement;
  const canvas = this.canvas.nativeElement;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return;

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0);

  // Captura a imagem como base64
  const imageDataUrl = canvas.toDataURL('image/png');

  if (this.step === 'front') {
    this.frontImage = imageDataUrl;
    this.statusMsg = "✅ Frente capturada";
    this.step = 'back';
  } else {
    this.backImage = imageDataUrl;
    this.statusMsg = "✅ Verso capturado";
    this.stopCamera();
  }
}


  // 🔹 Função de verificação documental com limiares ajustados
  private verificarDocumento(imageData: ImageData, width: number, height: number): boolean {
    // 1. Contraste
    let min = 255, max = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const brilho = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
      if (brilho < min) min = brilho;
      if (brilho > max) max = brilho;
    }
    const contraste = max - min;
    const contrasteOk = contraste > 20; // antes era 40

    // 2. Proporção
    const proporcao = width / height;
    const proporcaoOk = proporcao > 1.3 && proporcao < 1.8; // intervalo mais largo

    // 3. Bordas
    let bordas = 0;
    for (let i = 0; i < imageData.data.length - 4; i += 4) {
      const brilho1 = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
      const brilho2 = (imageData.data[i+4] + imageData.data[i+5] + imageData.data[i+6]) / 3;
      if (Math.abs(brilho1 - brilho2) > 40) bordas++; // antes era 50
    }
    const bordasOk = bordas > (width * height * 0.005); // antes era 0.01

    return contrasteOk && proporcaoOk && bordasOk;
  }

  stopCamera() {
    this.stream?.getTracks().forEach(track => track.stop());
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  confirmarEnvio() {
  if (!this.frontImage || !this.backImage) {
    this.statusMsg = "⚠️ Capture ambas as faces do documento primeiro.";
    return;
  }
  this.serviceEnviar.enviarDocumentos(this.frontImage, this.backImage).subscribe({
    next: (res) => {
      console.log('Resposta do backend:', res);
      // Armazena os dados extraídos (se houver) no serviço
      if (res.dados) {
        this.serviceEnviar.setDocumento(res.dados);
      }
      // Redireciona para a próxima página (reconhecimento facial)
      this.rota.navigate(['/reconhecimento']);
    },
    error: (err) => {
      console.error(err);
      this.statusMsg = "❌ Erro ao validar documento. Tente novamente.";
    }
  });
}


}
