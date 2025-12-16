import type { ICTX } from "@baileys/handlers/command-handling"

export default {
    name: 'example',
    access: ['owner', 'regular', "premium"], // can be owner, regular, or premium
    inGroup: true, // should the command executedd on group? true or false
    inGroupAccess: ['admin', 'member'], // access level if on group chat shoukd be isGroup: true
    async execute(args: string[], { msg, socket, whoAMI }: ICTX, ) {
        // logic here and
        // socket.sendMessage() also here
    }
}