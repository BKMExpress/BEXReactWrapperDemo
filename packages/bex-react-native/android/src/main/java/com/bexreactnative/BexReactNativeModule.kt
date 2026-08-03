package com.bexreactnative

import android.app.Activity
import android.graphics.Color
import com.bkm.mobil.sdk.api.BexEnvironment
import com.bkm.mobil.sdk.api.BexFullSdk
import com.bkm.mobil.sdk.api.BexFullSdkConfig
import com.bkm.mobil.sdk.api.BexFullSdkTheme
import com.bkm.mobil.sdk.api.BexSdkError
import com.bkm.mobil.sdk.api.CardSelectionResult
import com.bkm.mobil.sdk.api.PaymentCallback
import com.bkm.mobil.sdk.api.PaymentResult
import com.bkm.mobil.sdk.api.PaymentSecurity
import com.bkm.mobil.sdk.api.SdkInitParams
import com.bkm.mobil.sdk.api.SdkMode
import com.bkm.mobil.sdk.api.SdkPaymentInfo
import com.bkm.mobil.sdk.api.TransactionType
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.WritableMap
import java.util.HashMap
import java.util.UUID
import java.util.concurrent.atomic.AtomicBoolean

class BexReactNativeModule(
  private val reactContext: ReactApplicationContext
) : NativeBexReactNativeSpec(reactContext) {

  private var initializeConfig: HashMap<String, Any?>? = null
  private val flowInProgress = AtomicBoolean(false)

  override fun initialize(config: ReadableMap, promise: Promise) {
    try {
      requireString(config, "authToken")
      requireString(config, "merchantId")
      requireString(config, "merchantUserId")
      requireString(config, "gsmNo")
      requireString(config, "environment")
      initializeConfig = config.toHashMap()
      val result = Arguments.createMap()
      result.putBoolean("ok", true)
      promise.resolve(result)
    } catch (error: Exception) {
      rejectError(promise, "invalid_argument", error.message ?: "Invalid initialize config.")
    }
  }

  override fun pay(payment: ReadableMap, options: ReadableMap, promise: Promise) {
    startFlow(
      mode = SdkMode.PAYMENT,
      payment = payment,
      options = options,
      promise = promise
    )
  }

  override fun selectCard(options: ReadableMap, promise: Promise) {
    // Match android_demo: CARD_SELECTION_ONLY still initializes with paymentInfo.
    val paymentFromOptions =
      if (options.hasKey("payment") && !options.isNull("payment")) {
        options.getMap("payment")
      } else {
        null
      }
    startFlow(
      mode = SdkMode.CARD_SELECTION_ONLY,
      payment = paymentFromOptions,
      options = options,
      promise = promise
    )
  }

  private fun startFlow(
    mode: SdkMode,
    payment: ReadableMap?,
    options: ReadableMap,
    promise: Promise
  ) {
    val config = initializeConfig
    if (config == null) {
      rejectError(promise, "not_initialized", "Call BexFullSdk.initialize() before pay/selectCard.")
      return
    }

    if (!flowInProgress.compareAndSet(false, true)) {
      rejectError(promise, "already_in_progress", "A BEX SDK flow is already in progress.")
      return
    }

    val activity = reactContext.currentActivity
    val style = optionalString(options, "style") ?: "fullScreen"
    if (style == "sheet" && activity == null) {
      flowInProgress.set(false)
      rejectError(promise, "no_activity", "No current Activity available for bottom sheet presentation.")
      return
    }

    try {
      val initParams = buildInitParams(config, payment)
      val theme = resolveTheme(config, options)
      val troySonic = when (val value = config["troySonicSoundEnabled"]) {
        is Boolean -> value
        else -> true
      }

      val settled = AtomicBoolean(false)

      fun settleResolve(map: WritableMap) {
        if (settled.compareAndSet(false, true)) {
          flowInProgress.set(false)
          promise.resolve(map)
        }
      }

      fun settleReject(code: String, message: String, title: String? = null, nativeCode: Int? = null) {
        if (settled.compareAndSet(false, true)) {
          flowInProgress.set(false)
          rejectError(promise, code, message, title, nativeCode)
        }
      }

      // Prefer Activity context like android_demo (LocalContext / Activity).
      val initContext = activity ?: reactContext

      BexFullSdk.init(
        context = initContext,
        initParams = initParams,
        callback = object : PaymentCallback {
          override fun onPaymentSuccess(result: PaymentResult) {
            val map = Arguments.createMap()
            map.putString("status", "completed")
            map.putString("transactionId", result.transactionId)
            map.putDouble("amount", result.amount)
            if (result.cardNumber != null) {
              map.putString("cardNumber", result.cardNumber)
            }
            settleResolve(map)
          }

          override fun onCardSelected(result: CardSelectionResult) {
            val card = result.selectedCard
            val bank = Arguments.createMap()
            bank.putString("cardType", card.bexBankInformation.cardType)
            bank.putString("cardBrandType", card.bexBankInformation.cardBrandType)
            bank.putString("cardBrand", card.bexBankInformation.cardBrand)
            bank.putString("bankShortName", card.bexBankInformation.bankShortName)

            val cardMap = Arguments.createMap()
            cardMap.putString("cardId", card.cardId)
            cardMap.putString("maskCardNumber", card.maskCardNumber)
            card.cardAlias?.let { cardMap.putString("cardAlias", it) }
            card.binValue?.let { cardMap.putString("binValue", it) }
            card.imageUrl?.let { cardMap.putString("imageUrl", it) }
            cardMap.putMap("bankInformation", bank)
            cardMap.putBoolean("active", card.active)

            val map = Arguments.createMap()
            map.putString("status", "selected")
            map.putMap("card", cardMap)
            settleResolve(map)
          }

          override fun onError(error: BexSdkError) {
            if (error is BexSdkError.Cancelled) {
              val map = Arguments.createMap()
              map.putString("status", "cancelled")
              settleResolve(map)
              return
            }

            when (error) {
              is BexSdkError.Network -> settleReject("network", error.displayMessage)
              is BexSdkError.Unauthorized -> settleReject("unauthorized", error.displayMessage)
              is BexSdkError.Api -> settleReject(
                "api",
                error.displayMessage,
                error.title,
                error.code
              )
              is BexSdkError.Unknown -> settleReject("unknown", error.displayMessage)
              is BexSdkError.Cancelled -> settleReject("cancelled", error.displayMessage)
            }
          }
        },
        theme = theme,
        config = BexFullSdkConfig(
          troySonicSoundEnabled = troySonic,
          mode = mode
        )
      )

      if (style == "sheet") {
        BexFullSdk.showAsBottomSheet(activity as Activity)
      } else {
        BexFullSdk.start()
      }
    } catch (error: Exception) {
      flowInProgress.set(false)
      rejectError(promise, "unknown", error.message ?: "Failed to start BEX SDK flow.")
    }
  }

  private fun buildInitParams(
    config: HashMap<String, Any?>,
    payment: ReadableMap?
  ): SdkInitParams {
    val currencyDefault = mapString(config, "currencyCode") ?: "TRY"
    // android_demo always passes paymentInfo for both PAYMENT and CARD_SELECTION_ONLY
    // via DemoFormState.toInitParams(). Omitting it breaks card-selection init.
    val paymentInfo = buildPaymentInfo(config, payment, currencyDefault)

    return SdkInitParams(
      token = requireMapString(config, "authToken"),
      merchantId = requireMapString(config, "merchantId"),
      transactionId = optionalString(payment, "transactionId") ?: UUID.randomUUID().toString(),
      gsmNo = requireMapString(config, "gsmNo"),
      merchantUserId = requireMapString(config, "merchantUserId"),
      paymentInfo = paymentInfo,
      environment = mapEnvironment(requireMapString(config, "environment"))
    )
  }

  private fun buildPaymentInfo(
    config: HashMap<String, Any?>,
    payment: ReadableMap?,
    currencyDefault: String
  ): SdkPaymentInfo {
    val amount = when {
      payment != null && payment.hasKey("amount") && !payment.isNull("amount") ->
        payment.getDouble("amount")
      else -> 100.0
    }
    val installmentCount = when {
      payment != null && payment.hasKey("installmentCount") && !payment.isNull("installmentCount") ->
        payment.getInt("installmentCount")
      else -> (config["installmentCount"] as? Number)?.toInt() ?: 1
    }

    return SdkPaymentInfo(
      amount = amount,
      orderId = optionalString(payment, "orderId")
        ?: "DEMO-${System.currentTimeMillis()}",
      transactionDate = optionalString(payment, "transactionDate")
        ?: System.currentTimeMillis().toString(),
      paymentSecurity = mapPaymentSecurity(optionalString(payment, "security") ?: "none"),
      currency = optionalString(payment, "currency") ?: currencyDefault,
      installmentCount = installmentCount,
      transactionType = mapTransactionType(
        optionalString(payment, "transactionType")
          ?: mapString(config, "transactionType")
          ?: "sale"
      ),
      successUrl = optionalString(payment, "successUrl")
        ?: "https://trcuzdan-dev.bkmtest.com.tr/sdk/demo/success",
      failUrl = optionalString(payment, "failUrl")
        ?: "https://trcuzdan-dev.bkmtest.com.tr/sdk/demo/fail"
    )
  }

  private fun resolveTheme(config: HashMap<String, Any?>, options: ReadableMap): BexFullSdkTheme? {
    val themeFromOptions = if (options.hasKey("theme") && !options.isNull("theme")) {
      options.getMap("theme")?.toHashMap()
    } else {
      null
    }
    @Suppress("UNCHECKED_CAST")
    val themeMap = themeFromOptions
      ?: (config["theme"] as? HashMap<String, Any?>)
      ?: return null

    @Suppress("UNCHECKED_CAST")
    val colorsMap = themeMap["colors"] as? HashMap<String, Any?>

    val colors = colorsMap?.let {
      BexFullSdkTheme.Colors(
        primary = parseColor(mapString(it, "primary")),
        primaryVariant = parseColor(mapString(it, "primaryVariant")),
        background = parseColor(mapString(it, "background")),
        surface = parseColor(mapString(it, "surface")),
        textPrimary = parseColor(mapString(it, "textPrimary")),
        textSecondary = parseColor(mapString(it, "textSecondary")),
        textOnPrimary = parseColor(mapString(it, "textOnPrimary")),
        buttonPrimary = parseColor(mapString(it, "buttonPrimary")),
        buttonPrimaryText = parseColor(mapString(it, "buttonPrimaryText")),
        buttonSecondaryBorder = parseColor(mapString(it, "buttonSecondaryBorder")),
        buttonSecondaryText = parseColor(mapString(it, "buttonSecondaryText")),
        buttonDisabled = parseColor(mapString(it, "buttonDisabled")),
        success = parseColor(mapString(it, "success")),
        error = parseColor(mapString(it, "error")),
        warning = parseColor(mapString(it, "warning")),
        border = parseColor(mapString(it, "border")),
        divider = parseColor(mapString(it, "divider"))
      )
    }

    val shape = BexFullSdkTheme.Shape(
      buttonCornerRadius = (themeMap["buttonCornerRadius"] as? Number)?.toFloat(),
      buttonBorderWidth = (themeMap["buttonBorderWidth"] as? Number)?.toFloat()
    )

    return BexFullSdkTheme(colors = colors, shape = shape)
  }

  private fun mapEnvironment(value: String): BexEnvironment = when (value.lowercase()) {
    "dev" -> BexEnvironment.DEV
    "test" -> BexEnvironment.TEST
    "preprod" -> BexEnvironment.PREPROD
    "prod" -> BexEnvironment.PROD
    else -> throw IllegalArgumentException("Unsupported environment: $value")
  }

  private fun mapPaymentSecurity(value: String): PaymentSecurity = when (value.lowercase()) {
    "tds" -> PaymentSecurity.TDS
    "otp" -> PaymentSecurity.OTP
    "none" -> PaymentSecurity.NONE
    else -> throw IllegalArgumentException("Unsupported payment security: $value")
  }

  private fun mapTransactionType(value: String): TransactionType = when (value.lowercase()) {
    "sale" -> TransactionType.SALE
    "preauth", "pre_auth" -> TransactionType.PRE_AUTH
    "recurring" -> TransactionType.RECURRING
    else -> throw IllegalArgumentException("Unsupported transaction type: $value")
  }

  private fun parseColor(value: String?): Int? {
    if (value.isNullOrBlank()) return null
    val normalized = if (value.startsWith("#")) value else "#$value"
    return try {
      Color.parseColor(normalized)
    } catch (_: IllegalArgumentException) {
      // Support #RRGGBBAA by rearranging to Android #AARRGGBB when needed.
      if (normalized.length == 9) {
        val rgb = normalized.substring(1, 7)
        val alpha = normalized.substring(7, 9)
        Color.parseColor("#$alpha$rgb")
      } else {
        null
      }
    }
  }

  private fun requireString(map: ReadableMap, key: String): String {
    val value = optionalString(map, key)?.trim()
    require(!value.isNullOrEmpty()) { "$key is required." }
    return value
  }

  private fun requireMapString(map: HashMap<String, Any?>, key: String): String {
    val value = mapString(map, key)?.trim()
    require(!value.isNullOrEmpty()) { "$key is required." }
    return value
  }

  private fun optionalString(map: ReadableMap?, key: String): String? {
    if (map == null || !map.hasKey(key) || map.isNull(key)) return null
    return map.getString(key)
  }

  private fun mapString(map: HashMap<String, Any?>, key: String): String? {
    return map[key]?.toString()
  }

  private fun rejectError(
    promise: Promise,
    code: String,
    message: String,
    title: String? = null,
    nativeCode: Int? = null
  ) {
    val userInfo = Arguments.createMap()
    userInfo.putString("code", code)
    userInfo.putString("message", message)
    if (title != null) userInfo.putString("title", title)
    if (nativeCode != null) userInfo.putInt("nativeCode", nativeCode)
    promise.reject(code, message, userInfo)
  }

  companion object {
    const val NAME = NativeBexReactNativeSpec.NAME
  }
}
