export default (numberOfTickets: number) => {
    let result           = [];
    const characters       = '0123456789';
    const charLen = characters.length;
    for(var j=0; j < numberOfTickets; j++){
        let ticket = "";
        for ( var i = 0; i < 6; i++ ) {
            ticket += characters.charAt(Math.floor(Math.random() * charLen));
        }
        result.push(ticket)
    }

    return result;
}