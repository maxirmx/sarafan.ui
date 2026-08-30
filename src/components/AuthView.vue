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
  const normalizedPhone = phone.value.trim()
  if (!normalizedPhone) {
    error.value = 'Введите номер телефона'
    return
  }

  phone.value = normalizedPhone
  busy.value = true
  error.value = ''
  try {
    await requestCode(normalizedPhone, mode.value)
    step.value = 'code'
  } catch (value) {
    error.value = errorMessage(value)
  } finally {
    busy.value = false
  }
}

async function submitCode() {
  const normalizedCode = code.value.trim()
  if (!normalizedCode) {
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
      code: normalizedCode,
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
    <div
      class="auth-scene"
      aria-hidden="true"
    >
      <div class="auth-scene__copy">
        <span>Международные покупки</span>
        <p>
          Из магазина —<br>
          <em>прямо к вам</em>
        </p>
        <small>
          Выбирайте товары по всему миру.<br>
          Мы позаботимся обо всём остальном.
        </small>
      </div>

      <div class="auth-route">
        <span class="auth-route__line" />
        <span class="auth-route__stop auth-route__stop--store">
          <i />
          магазин
        </span>
        <span class="auth-route__stop auth-route__stop--warehouse">
          <i />
          проверка
        </span>
        <span class="auth-route__stop auth-route__stop--home">
          <i />
          у вашей двери
        </span>
      </div>

      <svg
        class="auth-ornament"
        viewBox="0 0 360 286"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M184 292C178 247 211 228 207 188C204 154 180 143 184 109C187 85 205 69 226 58" />
        <path d="M185 233C149 223 132 199 133 168C134 144 147 126 164 114" />
        <path d="M207 188C237 181 254 162 259 137C264 112 255 91 239 77" />
        <path d="M135 168C109 164 91 148 84 126C77 103 84 81 100 65" />
        <path
          d="M226 58C211 48 207 31 217 18C229 28 234 43 226 58Z"
          fill="currentColor"
        />
        <path
          d="M226 58C240 45 258 45 270 57C259 70 243 72 226 58Z"
          fill="currentColor"
        />
        <path
          d="M100 65C84 58 76 43 81 28C98 33 108 47 100 65Z"
          fill="currentColor"
        />
        <path
          d="M100 65C114 54 132 56 141 70C129 81 113 80 100 65Z"
          fill="currentColor"
        />
        <path
          d="M164 114C148 106 142 91 148 77C164 83 172 98 164 114Z"
          fill="currentColor"
        />
        <path
          d="M259 137C275 124 294 125 305 139C292 152 274 151 259 137Z"
          fill="currentColor"
        />
        <circle
          cx="226"
          cy="58"
          r="8"
        />
        <circle
          cx="100"
          cy="65"
          r="7"
        />
        <circle
          cx="164"
          cy="114"
          r="6"
        />
      </svg>
    </div>

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
