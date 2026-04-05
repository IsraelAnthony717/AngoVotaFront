// eleitor.component.ts
import { AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CandidatoService } from '../services/candidato.service';
import { Pessoa } from '../models/Pessoa';

@Component({
  selector: 'app-eleitor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './eleitor.component.html',
  styleUrls: ['./eleitor.component.css']
})
export class EleitorComponent implements OnInit, AfterViewInit {
alert(arg0: string) {
throw new Error('Method not implemented.');
}
  candidatos: Pessoa[] = [];

  constructor(private candidatoService: CandidatoService) {}

  ngOnInit(): void {
    this.candidatoService.candidatos$.subscribe(lista => {
      this.candidatos = lista;
    });
  }

  votar(candidato: Pessoa): void {
    if (!candidato.id) {
      alert('Candidato inválido (sem ID).');
      return;
    }

    this.candidatoService.votar(candidato.id).subscribe({
      next: (res) => {
        alert(`Voto computado para ${candidato.nome} (${candidato.abrevpartido})!`);
      },
      error: (err) => {
        console.error('Erro ao registrar voto', err);
        alert('Erro ao registrar voto. Tente novamente.');

      }
    })
  }


  // Rolagem (esquerda_direita)
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    event.preventDefault();

    const container = document.querySelector('.urna-elegante');
    if (container) {

      container.scrollLeft += event.deltaY;
    }

  }


  @ViewChild('bgVideo') video! : ElementRef<HTMLVideoElement>;

  ngAfterViewInit(): void {
    this.video.nativeElement.muted = true;
    this.video.nativeElement.play();
    this.video.nativeElement.volume = 0!;
  }

}
