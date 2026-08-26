<template>
  <v-app>
    <v-main class="app-shell">
      <v-container
        class="d-flex align-center justify-center fill-height pa-6"
        fluid
      >
        <v-card
          class="welcome-card pa-8 pa-sm-12"
          elevation="8"
          max-width="720"
          rounded="xl"
        >
          <v-chip
            class="mb-6"
            color="primary"
            variant="tonal"
          >
            Ready for development
          </v-chip>

          <h1 class="text-h2 font-weight-bold mb-4">
            Sarafan
          </h1>
          <p class="text-h6 text-medium-emphasis mb-8">
            The Vue and Vuetify foundation is in place.
          </p>

          <v-divider class="mb-6" />

          <div class="d-flex flex-wrap ga-3">
            <v-chip
              color="primary"
              variant="outlined"
            >
              Vue 3
            </v-chip>
            <v-chip
              color="secondary"
              variant="outlined"
            >
              Vuetify 4
            </v-chip>
            <v-chip variant="outlined">
              Vite 8
            </v-chip>
            <v-chip variant="outlined">
              nginx
            </v-chip>
          </div>
        </v-card>
      </v-container>
    </v-main>
  </v-app>
</template>

<style scoped>
.welcome-card {
  border: 1px solid rgba(93, 63, 211, 0.12);
  backdrop-filter: blur(18px);
}
</style>
