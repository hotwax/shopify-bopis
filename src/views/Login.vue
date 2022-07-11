<template>
  <ion-page>
    <ion-content>
      <div class="flex">
        <form class="login-container" @keyup.enter="login(form)" @submit.prevent="login(form)">
          <Logo />
          <ion-item lines="full">
            <ion-label position="fixed">{{ $t("Username") }}</ion-label>
            <ion-input name="username" v-model="username" id="username"  type="text" required />
          </ion-item>
          <ion-item lines="none">
            <ion-label position="fixed">{{ $t("Password") }}</ion-label>
            <ion-input name="password" v-model="password" id="password" type="password" required />
          </ion-item>

          <div class="ion-padding">
            <ion-button type="submit" color="primary" fill="outline" expand="block">{{ $t("Login") }}</ion-button>
          </div>
        </form>
      </div>
    </ion-content>
  </ion-page>
</template>

<script lang="ts">
import { 
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonPage
} from "@ionic/vue";
import { defineComponent } from "vue";
import { useRouter } from "vue-router";
import { useStore } from "@/store";
import { mapGetters } from "vuex";
import Logo from '@/components/Logo.vue';
import { showToast } from "@/utils";
import { translate } from "@/i18n";

export default defineComponent({
  name: "Login",
  components: {
    IonButton,
    IonContent,
    IonInput,
    IonItem,
    IonLabel,
    IonPage,
    Logo
  },
  data () {
    return {
      username: "",
      password: "",
      instanceUrl: ""
    };
  },
  computed: {
    ...mapGetters({
      currentInstanceUrl: 'user/getInstanceUrl',
      shop: 'shop/getShop',
      shopifyConfig: 'shop/getShopConfigId'
    })
  },
  mounted() {
    this.store.dispatch('shop/setShop', this.$route.redirectedFrom?.query.shop);
    this.store.dispatch('order/setCurrentDraftOrderId', this.$route.redirectedFrom?.query.id);
    const shop = this.shop as any;
    const shopConfig = JSON.parse(process.env.VUE_APP_SHOPIFY_SHOP_CONFIG);
    this.instanceUrl = shopConfig[shop]?.oms;
  },
  methods: {
    login: function () {
      this.store.dispatch("user/setUserInstanceUrl", this.instanceUrl.trim())
      
      const { username, password } = this;
      this.store.dispatch("user/login", { username, password }).then( async (data: any) => {
        await this.store.dispatch('shop/getShopifyConfigId', this.$route.query.shop ? this.$route.query.shop : this.$route.redirectedFrom?.query.shop );
        if (data.token && this.shopifyConfig) {
          this.username = ''
          this.password = ''
          this.$router.push('/order-detail');
        } else {
          showToast(translate("Shopify Configuration missing. You can not login."))
          this.store.dispatch('user/logout').then(() => {
            this.router.push('/login');
          })
        }
      })
    }
  },
  setup () {
    const router = useRouter();
    const store = useStore();
    return { router, store };
  }
});
</script>
<style scoped>
.login-container {
  width: 375px;
}

.flex {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}
</style>