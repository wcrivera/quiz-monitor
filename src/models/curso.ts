import { Schema, model, Types } from 'mongoose';

interface Curso {
    id: Types.ObjectId;
    sigla: string,
    nombre: string,
    descripcion: string,
    canvas: Array<{ curso_id: number }>;
}

const CursoSchema = new Schema<Curso>({
    sigla: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    descripcion: {
        type: String,
        required: true,
        trim: true
    },
    canvas: [{
        curso_id: {
            type: Number,
            required: true
        }
    }]
});

CursoSchema.method('toJSON', function () {
    const { _id, ...object } = this.toObject();
    object.id = _id;
    return object;
})

export default model("Curso", CursoSchema)

