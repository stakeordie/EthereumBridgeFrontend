import React, { useContext, useState } from "react";
import createViewKey from "../../pages/SecretLottery/api/createViewKey";
import constants from "../../constants";
import { ClientContext } from "../../stores/lottery-context/ClientContext";
import { ViewKeyContext, ViewKeyDispatchContext } from "../../stores/lottery-context/ViewKeyContext";
import {errorNotification, successNotification} from "../../utils/secret-lottery/notifications";

export default ({
    menu
}: {
    menu: string
}) => {
    const client = useContext(ClientContext);
    const viewkey = useContext(ViewKeyContext);
    const viewkeyDispatchState = useContext(ViewKeyDispatchContext);
    const [createViewKeyLoading, setCreateViewKeyLoading] = useState<Boolean>(false)

    if (client && !viewkey) {
        return (
            <div style={{ width: "100%", marginTop: "50px" }}>
                {
                    client ? 
                    <button 
                        type="button" 
                        className="btn btn-light"
                        onClick={async() => {
                            setCreateViewKeyLoading(true)
                            try {
                                let contract = constants.SECRET_LOTTERY_CONTRACT_ADDRESS;
                                const response = await createViewKey(client, contract)
                                successNotification("View Key Created!")
                                console.log(response)
                                viewkeyDispatchState(response.create_viewing_key.key)
                                localStorage.setItem(`${menu}_` + client.accountData.address,response.create_viewing_key.key)
                            } catch (e) {
                                errorNotification(e);
                            } 
                            setCreateViewKeyLoading(false)
                        }}
                    > {
                        createViewKeyLoading ?
                        <i className="fa fa-spinner fa-spin"></i>
                             : 
                        "Create View Key"
                    } </button>
                    :
                    "Keplr connection failed"
                }
            </div>
        )
    } else {
        return null
    }
}