import { Component, OnInit, signal } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

interface ImagenItem {
  name: string;
  path: string;
}

@Component({
  selector: "app-root",
  imports: [RouterOutlet],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent implements OnInit {
  selectedFiles = signal<ImagenItem[]>([]);
  statusMessage = signal<string>("Arrastra tus imágenes HEIC o usa el botón para seleccionarlas");
  isConverting = signal<boolean>(false);

  async ngOnInit() {
    try {
      await getCurrentWindow().onDragDropEvent((event) => {
        if (event.payload.type === 'drop') {
          const paths = event.payload.paths;
          if (paths && paths.length > 0) {
            const nuevasImagenes: ImagenItem[] = paths.map((filePath) => {
              const fullName = filePath.split(/[\\/]/).pop() || '';
              const nameWithoutExt = fullName.substring(0, fullName.lastIndexOf('.')) || fullName;
              return {
                name: nameWithoutExt,
                path: filePath,
              };
            });

            this.selectedFiles.update((current) => [...current, ...nuevasImagenes]);
            this.statusMessage.set(`${this.selectedFiles().length} archivo(s) listo(s) para convertir`);
          }
        }
      });
    } catch (e) {
      console.error("Error al inicializar drag-drop de Tauri:", e);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDropFile(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const nuevasImagenes: ImagenItem[] = [];
      
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i] as File & { path?: string };
        const filePath = file.path || "";
        const fullName = file.name;
        const nameWithoutExt = fullName.substring(0, fullName.lastIndexOf('.')) || fullName;

        if (filePath) {
          nuevasImagenes.push({
            name: nameWithoutExt,
            path: filePath,
          });
        }
      }

      if (nuevasImagenes.length > 0) {
        this.selectedFiles.update((current) => [...current, ...nuevasImagenes]);
        this.statusMessage.set(`${this.selectedFiles().length} archivo(s) listo(s) para convertir`);
      } else {
        this.statusMessage.set("No se pudo obtener la ruta completa. Te recomendamos arrastrar los archivos directamente.");
      }
      
      // Reset input
      input.value = "";
    }
  }

  removerArchivo(index: number): void {
    this.selectedFiles.update((current) => current.filter((_, i) => i !== index));
    if (this.selectedFiles().length === 0) {
      this.statusMessage.set("Arrastra tus imágenes HEIC o usa el botón para seleccionarlas");
    } else {
      this.statusMessage.set(`${this.selectedFiles().length} archivo(s) listo(s) para convertir`);
    }
  }

  limpiarTodo(): void {
    this.selectedFiles.set([]);
    this.statusMessage.set("Lista vacía.");
  }

  async convertirTodas(): Promise<void> {
    const files = this.selectedFiles();
    if (files.length === 0) return;

    this.isConverting.set(true);
    this.statusMessage.set(`Convirtiendo ${files.length} imagen(es)...`);

    try {
      const convertidas = await invoke<number>("convertir_imagenes", {
        imagenes: files,
      });
      this.statusMessage.set(`¡Conversión completada! Se convirtieron ${convertidas} de ${files.length} imágenes exitosamente.`);
    } catch (error) {
      console.error(error);
      this.statusMessage.set(`Error al convertir las imágenes: ${error}`);
    } finally {
      this.isConverting.set(false);
    }
  }
}
