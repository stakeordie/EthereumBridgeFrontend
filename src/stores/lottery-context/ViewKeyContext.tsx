import React, { useState, createContext } from "react";

export const ViewKeyContext = createContext<string | null>(null);
export const ViewKeyDispatchContext = createContext<Function>(() => null);

export default (props: any) => {
    const [ViewKeyState, setViewKeyState] = useState<string | null>(null) 

    return (
        <ViewKeyContext.Provider value={ViewKeyState}>
             <ViewKeyDispatchContext.Provider value={setViewKeyState}>
                {props.children}
             </ViewKeyDispatchContext.Provider>
        </ViewKeyContext.Provider>
    );
  }