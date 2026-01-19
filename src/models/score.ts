import { Schema, model, Types } from 'mongoose';

interface Score {
    id: Types.ObjectId;
    ejercicio_id: Schema.Types.ObjectId;
    canvas_curso_id: number;
    canvas_usuario_id: number;
    score: number
}

const ScoreSchema = new Schema<Score>({
    ejercicio_id: {
        type: Schema.Types.ObjectId,
        ref: "Ejercicio",
        required: true
    },
    canvas_curso_id: {
        type: Number,
        required: true
    },
    canvas_usuario_id: {
        type: Number,
        required: true
    },
    score: {
        type: Number,
        required: true
    }
},
    {
        timestamps: true
    }
);

ScoreSchema.method('toJSON', function () {
    const { _id, ...object } = this.toObject();
    object.id = _id;
    return object;
})

export default model("Score", ScoreSchema)

