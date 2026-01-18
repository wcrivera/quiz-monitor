import { Schema, model, Types } from 'mongoose';

interface Score {
    id: Types.ObjectId;
    curso_id: Schema.Types.ObjectId;
    ejercicio_id: Schema.Types.ObjectId;
    usuario_id: Schema.Types.ObjectId;
    score: number
}

const ScoreSchema = new Schema<Score>({
    curso_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    ejercicio_id: {
        type: Schema.Types.ObjectId,
        required: true
    },
    usuario_id: {
        type: Schema.Types.ObjectId,
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

