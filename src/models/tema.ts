import { Schema, Types, model } from "mongoose";

interface Tema {
    id: Types.ObjectId;
    curso_id: Schema.Types.ObjectId;
    capitulo_id: Schema.Types.ObjectId;
    clase_id: Schema.Types.ObjectId;
    numero: number;
    nombre: string;
    activo: Boolean;
}

const TemaSchema = new Schema<Tema>({
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
    numero: {
        type: Number,
        required: true,
        trim: true,
    },
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    activo: {
        type: Boolean,
        default: true,
    },
});

TemaSchema.method("toJSON", function () {
    const { _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

export default model("Tema", TemaSchema);
