import { Schema, Types, model } from "mongoose";

interface Diapositiva {
    id: Types.ObjectId;
    curso_id: Schema.Types.ObjectId;
    capitulo_id: Schema.Types.ObjectId;
    clase_id: Schema.Types.ObjectId;
    tema_id: Schema.Types.ObjectId;
    autor: string;
    diapositivas: [{ pagina: number; contenido: string }];
    activo: Boolean;
}

const DiapositivaSchema = new Schema<Diapositiva>({
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
    autor: {
        type: String,
        required: true,
        trim: true,
    },
    diapositivas: [
        {
            pagina: {
                type: Number,
                required: true,
            },
            contenido: {
                type: String,
                required: true,
            },
        },
    ],
    activo: {
        type: Boolean,
        default: false,
    }
});

DiapositivaSchema.method("toJSON", function () {
    const { _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

export default model("Diapositiva", DiapositivaSchema);
