const { io } = require('../server');
const { Usuarios } = require('../../classes/usuarios')
const usuarios = new Usuarios()
const { crearMensaje } = require('./utilidades/utilidades')
io.on('connection', (client) => {
    client.on('entrarChat', (usuario, callback) => {
        if (!usuario.nombre || !usuario.sala) {
            return callback({
                err: true,
                mensaje: 'Nombre y sala son necesarios'
            })
        }
        client.join(usuario.sala)
        usuarios.agregarPersona(client.id, usuario.nombre, usuario.sala)
        client.broadcast.to(usuario.sala).emit('listaPersonas', usuarios.getPersonasPorSala(usuario.sala))
        client.broadcast.to(usuario.sala).emit('crearMensaje', crearMensaje('Administrador', `${usuario.nombre} se unió`))
        callback(usuarios.getPersonasPorSala(usuario.sala))
    })
    client.on('crearMensaje', (data, callback) => {
        let persona = usuarios.getPersona(client.id)
        let mensaje = crearMensaje(persona.nombre, data.mensaje)
        client.broadcast.to(persona.sala).emit('crearMensaje', mensaje)
        callback(mensaje)
    })
    client.on('disconnect', () => {
        let personaBorrada = usuarios.borrarPersona(client.id)
        client.broadcast.to(personaBorrada.sala).emit('crearMensaje', crearMensaje('Administrador', `${personaBorrada.nombre} salió`))
        client.broadcast.to(personaBorrada.sala).emit('listaPersonas', usuarios.getPersonasPorSala(personaBorrada.sala))
    })
    client.on('mensajePrivado', (data) => {
        let persona = usuarios.getPersona(client.id)
        client.broadcast.to(data.para).emit('mensajePrivado', crearMensaje(persona.nombre, data.mensaje))
    })
});