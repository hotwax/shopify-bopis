import { toastController } from '@ionic/vue';

// TODO Use separate files for specific utilities

const showToast = async() => {
  const toast = await toastController
    .create({
      message: 'Something went wrong',
      duration: 3000,
      position: 'top',
    })
  return toast.present();
}

export { showToast }