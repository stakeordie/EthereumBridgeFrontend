import React, { useEffect, useState } from "react";
import { Button } from 'semantic-ui-react'
import {errorNotification, successNotification} from "../../utils/secret-lottery/notifications";
import { useStores } from "stores";

export default ({
    menu
}: {
    menu: string
}) => {
    const [createViewKeyLoading, setCreateViewKeyLoading] = useState<Boolean>(false)
    const { lottery }= useStores();
    const { client ,viewingKey}= lottery;

    useEffect(() => {
        if (client) {
            lottery.setViewingKey(null);

            if (menu === "SEFI") {
                lottery.getSEFIBalance()
                if (localStorage.getItem("SEFI_" + client.accountData.address)) {
                  lottery.setViewingKey(localStorage.getItem("SEFI_" + client.accountData.address))
                }
            }
        }
    }, [client, menu])
        return (

            (client?.execute && !viewingKey) ?
                <div style={{ width: "100%", justifyContent: 'center', padding: '1rem 0', display: 'flex' }}>
                    <Button
                        style={{ width: "210px" }}
                        type="button"
                        color="black"
                        fluid
                        onClick={async () => {
                            setCreateViewKeyLoading(true)
                            try {
                                await lottery.createViewing(menu,client);
                                successNotification("View Key Created!")
                                
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
