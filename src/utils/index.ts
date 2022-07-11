import { toastController } from '@ionic/vue';

// TODO Use separate files for specific utilities

const showToast = async(message: string) => {
  const toast = await toastController
    .create({
      message,
      duration: 3000,
      position: 'top',
    })
  return toast.present();
}

const hasError = (response: any) => {
  return !!response.data._ERROR_MESSAGE_ || !!response.data._ERROR_MESSAGE_LIST_;
}


export { showToast, hasError }