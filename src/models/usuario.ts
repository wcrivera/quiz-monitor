import { Schema, Types, model } from "mongoose";

interface Usuario {
    id: Types.ObjectId;
    nombre: string;
    apellido: string;
    email: string;
    canvas_user_id: number;
    canvas_course_id: number;
}

const UsuarioSchema = new Schema<Usuario>({
    nombre: {
        type: String,
        required: true,
        trim: true,
    },
    apellido: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    canvas_user_id: {
        type: Number,
        required: true,
    },
    canvas_course_id: {
        type: Number,
        required: true,
    },
});

UsuarioSchema.index(
    {
        email: 1,
        canvas_user_id: 1,
        canvas_course_id: 1
    },
    {
        unique: true,
        name: 'unique_user_course_email'
    }
); UsuarioSchema.index({
    canvas_user_id: 1,
    canvas_course_id: 1
}, {
    name: 'user_course_index'
}); UsuarioSchema.index({
    email: 1
}, {
    name: 'email_index'
}); UsuarioSchema.index({
    canvas_course_id: 1
}, {
    name: 'course_index'
});

UsuarioSchema.method("toJSON", function () {
    const { _id, ...object } = this.toObject();
    object.id = _id;
    return object;
});

export default model("Usuario", UsuarioSchema);
