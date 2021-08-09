export default (baseDiscount: number, ticketCount: number, pricePerTicket: string) => {
    if (ticketCount === 0) return {finalPrice: 0, discount: 0}
    else if (ticketCount === 1) return {finalPrice: parseInt(pricePerTicket) * ticketCount, discount: 0}
    else {
        const discount = Math.round(((ticketCount - 1) * baseDiscount * 0.000001) * 1000) / 1000
        const priceDiscount = parseInt(pricePerTicket) * ticketCount * (discount * 0.01)
        return {finalPrice: Math.ceil(parseInt(pricePerTicket) * ticketCount - priceDiscount) , discount: discount}
    }
    
}