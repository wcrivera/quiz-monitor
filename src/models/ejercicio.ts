import { Schema, Types, model } from "mongoose";

interface Ejercicio {
  id: Types.ObjectId;
  curso_id: Schema.Types.ObjectId;
  capitulo_id: Schema.Types.ObjectId;
  numero: number;
  enunciado: string;
  solucion: string;
  video: string;
  ejercicio: { enunciado: string; alternativas: [{ letra: string; texto: string; correcta: boolean }] };
}

const EjercicioSchema = new Schema<Ejercicio>({
  curso_id: {
    type: Schema.Types.ObjectId,
    ref: "Curso",
  },
  capitulo_id: {
    type: Schema.Types.ObjectId,
    ref: "Capitulo",
  },
  numero: {
    type: Number,
    required: true,
    trim: true,
  },
  enunciado: {
    type: String,
    required: true,
    trim: true,
  },
  solucion: {
    type: String,
    required: false,
    trim: true,
  },
  video: {
    type: String,
    required: false,
    trim: true,
  },
  ejercicio: {
    enunciado: {
      type: String,
      required: true,
      trim: true,
    },
    alternativas: [
      {
        letra: {
          type: String,
          required: true,
          trim: true,
        },
        texto: {
          type: String,
          required: true,
          trim: true,
        },
        correcta: {
          type: Boolean,
          required: true,
        },
      },
    ],
  },
});

EjercicioSchema.method("toJSON", function () {
  const { _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

export default model("Ejercicio", EjercicioSchema);
