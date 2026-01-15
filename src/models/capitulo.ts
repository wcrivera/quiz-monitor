import { Schema, Types, model } from "mongoose";

interface Capitulo {
    id: Types.ObjectId;
    curso_id: Schema.Types.ObjectId;
    numero: number;
    nombre: string;
    activo: Boolean;
}

const CapituloSchema = new Schema<Capitulo>({
    curso_id: {
        type: Schema.Types.ObjectId,
        ref: "Curso",
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

CapituloSchema.method("toJSON", function () {
    const { _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

export default model("Capitulo", CapituloSchema);
