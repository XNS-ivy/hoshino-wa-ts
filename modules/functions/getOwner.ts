
export default function getOwner (userlid: string, socketlid: string){
    const fetch = socketlid.split(':')[0]
    const socket = `${fetch}@lid`
    const decision = socket == userlid
    return decision
}