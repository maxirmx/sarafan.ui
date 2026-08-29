<script setup>
// Copyright (C) 2026 Maxim [maxirmx] Samsonov (www.sw.consulting)
// All rights reserved.
// This file is a part of the Sarafan application

import { computed, ref, watch } from 'vue'

import { ApiError, useSession } from '../stores/session.js'

const { requestCode, verifyCode } = useSession()
const appIcon = '/favicon.svg'
const fixedCodeAvailable = import.meta.env.DEV
const mode = ref('login')
const step = ref('phone')
const phone = ref('')
const code = ref('')
const termsAccepted = ref(false)
const personalDataAccepted = ref(false)
const busy = ref(false)
const error = ref('')

const isRegistration = computed(() => mode.value === 'register')

watch(mode, () => {
  step.value = 'phone'
  code.value = ''
  error.value = ''
})

function errorMessage(value) {
  if (value instanceof ApiError && value.status === 404) {
    return mode.value === 'login'
      ? 'Пользователь с таким телефоном не найден. Выберите регистрацию.'
      : value.message
  }
  return value?.message || 'Сервис временно недоступен'
}

async function submitPhone() {
  if (!phone.value.trim()) {
    error.value = 'Введите номер телефона'
    return
  }

  busy.value = true
  error.value = ''
  try {
    await requestCode(phone.value, mode.value)
    step.value = 'code'
  } catch (value) {
    error.value = errorMessage(value)
  } finally {
    busy.value = false
  }
}

async function submitCode() {
  if (!code.value.trim()) {
    error.value = 'Введите код подтверждения'
    return
  }
  if (isRegistration.value && (!termsAccepted.value || !personalDataAccepted.value)) {
    error.value = 'Для регистрации необходимо принять оба согласия'
    return
  }

  busy.value = true
  error.value = ''
  try {
    await verifyCode({
      phone: phone.value,
      purpose: mode.value,
      code: code.value,
      termsAccepted: termsAccepted.value,
      personalDataAccepted: personalDataAccepted.value
    })
  } catch (value) {
    error.value = errorMessage(value)
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <main class="auth-shell">
    <section
      class="auth-card"
      aria-labelledby="auth-title"
    >
      <div class="auth-brand">
        <img
          :src="appIcon"
          alt=""
        >
        <div>
          <strong>Сарафан</strong>
          <span>покупки по всему миру</span>
        </div>
      </div>

      <div
        class="auth-tabs"
        role="tablist"
        aria-label="Способ входа"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'login'"
          :class="{ 'auth-tab--active': mode === 'login' }"
          @click="mode = 'login'"
        >
          Войти
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'register'"
          :class="{ 'auth-tab--active': mode === 'register' }"
          @click="mode = 'register'"
        >
          Регистрация
        </button>
      </div>

      <form
        v-if="step === 'phone'"
        class="auth-form"
        @submit.prevent="submitPhone"
      >
        <div>
          <span class="section-kicker">Личный кабинет</span>
          <h1 id="auth-title">
            {{ isRegistration ? 'Создайте аккаунт' : 'Рады видеть снова' }}
          </h1>
          <p>Укажите телефон — мы отправим одноразовый код для безопасного входа.</p>
        </div>
        <v-text-field
          v-model="phone"
          name="phone"
          label="Номер телефона"
          placeholder="+7 999 123-45-67"
          autocomplete="tel"
          inputmode="tel"
          variant="outlined"
          :disabled="busy"
        />
        <p
          v-if="error"
          class="form-error"
          role="alert"
        >
          {{ error }}
        </p>
        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          :loading="busy"
        >
          Получить код
        </v-btn>
      </form>

      <form
        v-else
        class="auth-form"
        @submit.prevent="submitCode"
      >
        <div>
          <span class="section-kicker">Подтверждение</span>
          <h1 id="auth-title">
            Введите код
          </h1>
          <p>
            Код отправлен на {{ phone }}.
            <template v-if="fixedCodeAvailable">
              В локальной среде разработки используйте 1111.
            </template>
          </p>
        </div>
        <v-text-field
          v-model="code"
          name="code"
          label="Код подтверждения"
          autocomplete="one-time-code"
          inputmode="numeric"
          maxlength="16"
          variant="outlined"
          :disabled="busy"
        />
        <div
          v-if="isRegistration"
          class="consent-list"
        >
          <v-checkbox
            v-model="termsAccepted"
            hide-details
            label="Я принимаю условия использования сервиса"
            :disabled="busy"
          />
          <v-checkbox
            v-model="personalDataAccepted"
            hide-details
            label="Я согласен на обработку персональных данных"
            :disabled="busy"
          />
        </div>
        <p
          v-if="error"
          class="form-error"
          role="alert"
        >
          {{ error }}
        </p>
        <v-btn
          type="submit"
          color="primary"
          size="large"
          block
          :loading="busy"
        >
          {{ isRegistration ? 'Зарегистрироваться' : 'Войти' }}
        </v-btn>
        <button
          class="auth-back"
          type="button"
          :disabled="busy"
          @click="step = 'phone'"
        >
          Изменить номер телефона
        </button>
      </form>
    </section>
  </main>
</template>
