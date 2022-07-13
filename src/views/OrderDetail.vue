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
        <h1 class="center-align">{{ $t("Order") }} {{ order.name }}</h1>
        <ion-card>
          <ion-list>
            <ion-item lines="none">
              <ion-label>
                <h2>{{order.customer?.first_name}} {{ order.customer?.last_name }}</h2>
                <p>CSR name</p>
              </ion-label>
              <ion-note slot="end">{{ timeFromNow(order?.created_at) }}</ion-note>
            </ion-item>
          </ion-list>
        </ion-card>

        <main v-for="item in order.line_items" :key="item.id">
          <ion-card>
            <ion-item lines="none">
              <ion-label>
                <h2>{{ item.title }}</h2>
                <p>{{ item.variant_title }}</p>
                <p class="ion-text-wrap">{{ $t("SKU") }}: {{ item.sku }}</p>
              </ion-label>
            </ion-item>
            <ion-item>
              <ion-checkbox slot="start" @ionChange="addProperty(item, $event)" />
              <ion-label>{{ $t("Pickup") }}</ion-label>
              <ion-note slot="end">{{ getProductStock(item.productSku) }} {{ $t("in stock") }}</ion-note>
            </ion-item>
          </ion-card>
        </main>
        <div class="text-center center-align">
          <ion-button @click="updateDraftOrder(order.line_items)">{{ $t("Save changes to order") }}</ion-button>
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
  IonBackButton,
  IonRadio,
  IonRadioGroup
} from "@ionic/vue";
import {
  sendOutline,
  swapVerticalOutline,
  callOutline,
  mailOutline,
} from "ionicons/icons";
import { defineComponent } from 'vue';
import { mapGetters, useStore } from 'vuex';
import { useRouter } from 'vue-router';
import { DateTime } from 'luxon';

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
    IonBackButton,
    IonRadio,
    IonRadioGroup
  },
  computed: {
    ...mapGetters({
      order: 'order/getDraftOrder',
      orderId: 'order/getCurrentDraftOrderId',
      configId: 'shop/getShopConfigId',
      shopifyStore: 'shop/getStore',
      getProductStock: 'stock/getProductStock'
    })
  },
  data(){
    return {}
  },
  async mounted(){
    if(this.$route.query.id){
      this.store.dispatch('order/setCurrentDraftOrderId', this.$route.query.id);
    }
    await this.store.dispatch('order/getDraftOrder', {id: this.orderId, configId: this.configId });
  },
  methods: {
    addProperty (item: any, event: any) {
      if(event.detail.checked){
        const address = `${this.shopifyStore.storeName}, ${this.shopifyStore.address1}, ${this.shopifyStore.city}`
        item.properties.push({ name: '_pickupstore', value: this.shopifyStore.storeCode }, { name: 'Pickup Store', value: address })
      }
    },
    updateDraftOrder (lineItems: any) {
      const id = this.orderId;
      this.store.dispatch('order/updateDraftOrder', {lineItems, id, configId: this.configId});
    },
    
    timeFromNow (time: string) {
      if (time) {
        const timeDiff = DateTime.fromISO(time).diff(DateTime.local());
        return DateTime.local().plus(timeDiff).toRelative();
      }
    },
  },
  setup() {
    const store = useStore();
    const router = useRouter();

    return {
      sendOutline,
      swapVerticalOutline,
      callOutline,
      mailOutline,
      router,
      store
    };
  },
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
Footer      
