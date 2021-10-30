import React, { useEffect, useState } from "react";
import { Button } from 'semantic-ui-react'
import {errorNotification, successNotification} from "../../utils/secret-lottery/notifications";
import { useStores } from "stores";
import { observer } from "mobx-react";

export default observer(({ menu }:{ menu:string }) => {
  const [createViewKeyLoading, setCreateViewKeyLoading] = useState<Boolean>(false)
  const [enablePermitLoading, setenablePermitLoading] = useState<Boolean>(false);

  const { lottery }= useStores();
  const { client, viewingKey, hasPermit } = lottery;
  
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

            (client?.execute && !hasPermit) ?
                <div style={{ width: "100%", justifyContent: 'center', padding: '1rem 0', display: 'flex' }}>
                    <Button
                        style={{ width: "210px" }}
                        type="button"
                        color="black"
                        fluid
                        onClick={async () => {
                            setenablePermitLoading(true)
                            try {
                                await lottery.enablePermit(client);
                                successNotification("Permit Enabled!")
                                
                            } catch (e) {
                                errorNotification(e);
                            }
                            setenablePermitLoading(false)
                        }}
                    > {
                        enablePermitLoading ?
                            <i className="fa fa-spinner fa-spin"></i>
                            :
                            "Enable Permit"
                      }
                    </Button>
                </div>
                :
                null
        )
    
})
