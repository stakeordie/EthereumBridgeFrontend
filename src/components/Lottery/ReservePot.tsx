import React from 'react';

const ReservePot = (props:{value:number})=>{
  return (
    <div  className='reserve_pot'>
      <span>Reserve Pot</span>
      <h4>
        {isNaN(props.value) ? '––' : props.value} SEFI
      </h4>
      <div>
        <img src="/static/pot_gold.png" alt="Total Reserve amount" />
      </div>
    </div>
  )
}
export default ReservePot;
