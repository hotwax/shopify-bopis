<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-back-button default-href="/" slot="start" />
        <ion-title>{{ $t("Order Details") }}</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div>
        <h1 class="center-align">{{ $t("Order") }}</h1>
        <ion-card>
          <ion-list>
            <ion-item lines="none">
              <ion-label>
                <h2>Customer name</h2>
                <p>CSR name</p>
              </ion-label>
              <ion-note slot="end">created date</ion-note>
            </ion-item>
          </ion-list>
        </ion-card>

        <main>
          <ion-card>
            <ion-item lines="none">
              <ion-label>
                <h2>Product name</h2>
                <p>size/color</p>
                <p class="ion-text-wrap">{{ $t("SKU") }}: SKU</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-checkbox slot="start" />
              <ion-label>{{ $t("Pickup") }}</ion-label>
              <ion-note slot="end">15 {{ $t("in stock") }}</ion-note>
            </ion-item>
          </ion-card>
        </main>
        <div class="text-center center-align">
          <ion-button>{{ $t("Save changes to order") }}</ion-button>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>
<script lang="ts">
import {
  IonButton,
  IonCard,
  IonCheckbox,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonTitle,
  IonToolbar,
  IonBackButton
} from "@ionic/vue";
import {
  sendOutline,
  swapVerticalOutline,
  callOutline,
  mailOutline,
} from "ionicons/icons";
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Home',
  components: {
    IonButton,
    IonCard,
    IonCheckbox,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonTitle,
    IonToolbar,
    IonBackButton
  },
  setup() {
    return {
      sendOutline,
      swapVerticalOutline,
      callOutline,
      mailOutline,
    }
  }
});
</script>

<style scoped>
ion-content > div {
  max-width: 400px;
  margin-right: auto;
  margin-left: auto;
}

.center-align {
  display: flex;
  justify-content: center;
}
</style>