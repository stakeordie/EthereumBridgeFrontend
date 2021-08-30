import getBalance from "pages/SecretLottery/api/getBalance";
import React, { useContext, useEffect, useState } from "react";
import { BalancesDispatchContext } from "stores/lottery-context/BalancesContext";
import { Button } from 'semantic-ui-react'
import createViewKey from "../../pages/SecretLottery/api/createViewKey";
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
    const balancesDispatch = useContext(BalancesDispatchContext);

    useEffect(() => {
        if (client) {
            viewkeyDispatchState(null);

            if (menu === "SEFI") {
                getSEFIBalance()
                if (localStorage.getItem("SEFI_" + client.accountData.address)) {
                    viewkeyDispatchState(localStorage.getItem("SEFI_" + client.accountData.address))
                }
            }
        }
    }, [client, menu])
    const getSEFIBalance = async () => {
        if (!client) return null
        const response = await getBalance(client, process.env.SCRT_GOV_TOKEN_ADDRESS);
        const accountData = await client.execute.getAccount(client.accountData.address);
        balancesDispatch({
            native: parseInt(accountData ? accountData.balance[0].amount : "0"),
            sSCRT: null,
            SEFI: response
        })
    }
        return (

            (client?.execute && !viewkey) ?
                <div style={{ width: "100%", justifyContent: 'center', padding: '1rem 0', display: 'flex' }}>
                    <Button
                        style={{ width: "210px" }}
                        type="button"
                        color="black"
                        fluid
                        onClick={async () => {
                            setCreateViewKeyLoading(true)
                            try {
                                let contract = process.env.REACT_APP_SECRET_LOTTERY_CONTRACT_ADDRESS;
                                const response = await createViewKey(client, contract)
                                successNotification("View Key Created!")
                                console.log(response)
                                viewkeyDispatchState(response.create_viewing_key.key)
                                localStorage.setItem(`${menu}_` + client.accountData.address, response.create_viewing_key.key)
                            } catch (e) {
                                errorNotification(e);
                            }
                            setCreateViewKeyLoading(false)
                        }}
                    > {
                            createViewKeyLoading ?
                                <i className="fa fa-spinner fa-spin"></i>
                                :
                                "Create Viewing Key"
                        }
                    </Button>
                </div>
                :
                null
        )
    
}