import { Schema, Types, model } from "mongoose";

interface Pregunta {
  id: Types.ObjectId;
  curso_id: Schema.Types.ObjectId;
  capitulo_id: Schema.Types.ObjectId;
  clase_id: Schema.Types.ObjectId;
  tema_id: Schema.Types.ObjectId;
  numero: number;
  enunciado: string;
  solucion: string;
  video: string;
  alternativas: [{ letra: string; texto: string; correcta: boolean }]
  activo: Boolean;
}

const PreguntaSchema = new Schema<Pregunta>({
  curso_id: {
    type: Schema.Types.ObjectId,
    ref: "Curso",
  },
  capitulo_id: {
    type: Schema.Types.ObjectId,
    ref: "Capitulo",
  },
  clase_id: {
    type: Schema.Types.ObjectId,
    ref: "Clase",
  },
  tema_id: {
    type: Schema.Types.ObjectId,
    ref: "Tema",
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
  alternativas: [
    {
      letra: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      texto: {
        type: String,
        required: true,
        trim: true,
      },
    },
    {
      correcta: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
  ],
  activo: {
    type: Boolean,
    default: false,
  }
});

PreguntaSchema.method("toJSON", function () {
  const { _id, ...object } = this.toObject();
  object.id = _id;
  return object;
});

export default model("Pregunta", PreguntaSchema);
