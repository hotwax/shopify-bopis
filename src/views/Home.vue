<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <ion-list class="ion-text-center">
        <img src="../assets/icon/icon.png" />
        <h1>{{ $t("Welcome to HC Bopis App") }}</h1>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { IonContent, IonPage, IonList } from '@ionic/vue';
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'Home',
  components: {
    IonContent,
    IonPage,
    IonList
  }
});
</script>

<style scoped>
img {
  margin-bottom: 25px;
  padding: 16px;
  width: 80vh;
}
</style>
