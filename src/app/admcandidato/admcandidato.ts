import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Pessoa } from '../models/Pessoa';
import { CandidatoService } from '../services/candidato.service';
import { Menu } from "../dashboard/menu/menu";
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admcandidato',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admcandidato.html',
  styleUrls: ['./admcandidato.css']
})
export class AdmCandidato implements OnInit {

  formulario = new FormGroup({
    nome: new FormControl('', [Validators.required, Validators.minLength(4)]),
    descricao: new FormControl('', [Validators.required, Validators.minLength(20)]),
    idade: new FormControl(null, [Validators.required, Validators.min(35)]),
    partido: new FormControl('', [Validators.required, Validators.minLength(4)]),
    abrevpartido: new FormControl('', [Validators.required, Validators.maxLength(7)]),
    cor: new FormControl('#0d59f2', [Validators.required]),
    foto: new FormControl(null)
  });

  imagePreview: string | ArrayBuffer | null = null;
  imagemSelecionada: File | null = null;
  botaos: boolean = true;
  vetor: Pessoa[] = [];
  indice: number = -1;  // índice no vetor local (para saber qual candidato está sendo editado)

  constructor(private candidatoService: CandidatoService) {}

  ngOnInit(): void {
    // Assina a lista reativa do serviço
    this.candidatoService.candidatos$.subscribe(lista => {
      this.vetor = lista;
    });

    // Opcional: forçar um recarregamento inicial (já é feito no serviço)
    // this.candidatoService.carregarCandidatos();
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];
    if (file) {
      this.imagemSelecionada = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.imagePreview = e.target?.result || null;
      };
      reader.readAsDataURL(file);
    }
  }

  cadastrar(): void {
    if (this.formulario.valid) {
      if (this.imagemSelecionada) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.formulario.patchValue({ foto: e.target?.result as string });
          this.salvarCandidato();
        };
        reader.readAsDataURL(this.imagemSelecionada);
      } else {
        this.salvarCandidato();
      }
    }
  }

  private salvarCandidato(): void {
    const novoCandidato = this.formulario.value as unknown as Omit<Pessoa, 'id'>;
    this.candidatoService.adicionar(novoCandidato).subscribe({
      next: (candidato) => {
        console.log('Candidato cadastrado:', candidato);
        this.limparFormulario();
      },
      error: (err) => {
        console.error('Erro ao cadastrar candidato', err);
        alert('Erro ao cadastrar candidato. Tente novamente.');
      }
    });
  }

  limparFormulario(): void {
    this.formulario.reset({ cor: '#0d59f2' });
    this.imagePreview = null;
    this.imagemSelecionada = null;
    this.botaos = true;
    this.indice = -1;
  }

  selecionar(indice: number): void {
    this.indice = indice;
    const candidato = this.vetor[indice];
    this.formulario.setValue({
      nome: candidato.nome,
      idade: candidato.idade,
      descricao: candidato.descricao,
      partido: candidato.partido,
      abrevpartido: candidato.abrevpartido,
      cor: candidato.cor || '#0d59f2',
      foto: candidato.foto || null
    });
    if (candidato.foto) {
      this.imagePreview = candidato.foto;
    }
    this.botaos = false;
  }

  alterar(): void {
    if (this.indice >= 0) {
      const candidato = this.vetor[this.indice];
      const id = candidato.id;
      if (!id) {
        alert('Candidato não possui ID. Não é possível alterar.');
        return;
      }

      if (this.imagemSelecionada) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.formulario.patchValue({ foto: e.target?.result as string });
          this.executarAlteracao(id);
        };
        reader.readAsDataURL(this.imagemSelecionada);
      } else {
        this.executarAlteracao(id);
      }
    }
  }

  private executarAlteracao(id: number): void {
    const candidatoAtualizado = this.formulario.value as Partial<Pessoa>;
    this.candidatoService.atualizar(id, candidatoAtualizado).subscribe({
      next: (candidato) => {
        console.log('Candidato atualizado:', candidato);
        this.limparFormulario();
      },
      error: (err) => {
        console.error('Erro ao atualizar candidato', err);
        alert('Erro ao atualizar candidato.');
      }
    });
  }

  remover(): void {
    if (this.indice >= 0) {
      const candidato = this.vetor[this.indice];
      const id = candidato.id;
      if (!id) {
        alert('Candidato não possui ID. Não é possível remover.');
        return;
      }

      this.candidatoService.remover(id).subscribe({
        next: () => {
          console.log('Candidato removido');
          this.limparFormulario();
        },
        error: (err) => {
          console.error('Erro ao remover candidato', err);
          alert('Erro ao remover candidato.');
        }
      });
    }
  }

  cancelar(): void {
    this.limparFormulario();
  }
}
