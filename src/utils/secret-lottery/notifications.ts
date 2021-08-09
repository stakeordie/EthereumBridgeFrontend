import { store } from "react-notifications-component";

export const errorNotification = async (error: Error) => {
  store.addNotification({
    title: "Error",
    message: error.message,
    type: "danger",
    insert: "bottom",
    container: "bottom-left",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
      duration: 3000,
      onScreen: true,
    },
  });
  return null;
}

export const successNotification = async (message: string) => {
  store.addNotification({
    title: "Success",
    message: message,
    type: "success",
    insert: "bottom",
    container: "bottom-left",
    animationIn: ["animate__animated", "animate__fadeIn"],
    animationOut: ["animate__animated", "animate__fadeOut"],
    dismiss: {
      duration: 3000,
      onScreen: true,
    },
  });
  return null;
}