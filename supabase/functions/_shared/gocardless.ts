// GoCardless Bank Account Data API client for Edge Functions
const GC_BASE_URL = 'https://bankaccountdata.gocardless.com/api/v2'

interface TokenResponse {
  access: string
  access_expires: number
  refresh: string
  refresh_expires: number
}

interface Institution {
  id: string
  name: string
  bic: string
  transaction_total_days: string
  countries: string[]
  logo: string
  max_access_valid_for_days: string
}

interface Requisition {
  id: string
  created: string
  redirect: string
  status: string
  institution_id: string
  agreement: string
  reference: string
  accounts: string[]
  user_language: string
  link: string
  ssn: string | null
  account_selection: boolean
  redirect_immediate: boolean
}

interface AccountDetails {
  account: {
    resourceId: string
    iban: string
    currency: string
    ownerName: string
    name: string
    product: string
    cashAccountType: string
  }
}

interface GCBalance {
  balances: Array<{
    balanceAmount: { amount: string; currency: string }
    balanceType: string
    referenceDate: string
  }>
}

interface GCTransaction {
  transactionId: string
  entryReference?: string
  bookingDate: string
  valueDate?: string
  transactionAmount: { amount: string; currency: string }
  creditorName?: string
  debtorName?: string
  remittanceInformationUnstructured?: string
  remittanceInformationStructured?: string
  proprietaryBankTransactionCode?: string
}

interface TransactionsResponse {
  transactions: {
    booked: GCTransaction[]
    pending: GCTransaction[]
  }
}

export class GoCardlessClient {
  private accessToken: string | null = null
  private secretId: string
  private secretKey: string

  constructor(secretId: string, secretKey: string) {
    this.secretId = secretId
    this.secretKey = secretKey
  }

  async authenticate(): Promise<void> {
    const res = await fetch(`${GC_BASE_URL}/token/new/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        secret_id: this.secretId,
        secret_key: this.secretKey,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GoCardless auth failed: ${res.status} ${text}`)
    }

    const data: TokenResponse = await res.json()
    this.accessToken = data.access
  }

  async listInstitutions(country: string = 'IT'): Promise<Institution[]> {
    return this.get(`/institutions/?country=${country}`)
  }

  async createAgreement(
    institutionId: string,
    maxHistoricalDays: number = 180,
    accessValidForDays: number = 90
  ) {
    return this.post('/agreements/enduser/', {
      institution_id: institutionId,
      max_historical_days: maxHistoricalDays,
      access_valid_for_days: accessValidForDays,
      access_scope: ['balances', 'details', 'transactions'],
    })
  }

  async createRequisition(
    institutionId: string,
    redirectUrl: string,
    reference: string,
    agreementId?: string
  ): Promise<Requisition> {
    const body: Record<string, unknown> = {
      redirect: redirectUrl,
      institution_id: institutionId,
      reference,
      user_language: 'IT',
    }
    if (agreementId) body.agreement = agreementId

    return this.post('/requisitions/', body)
  }

  async getRequisition(requisitionId: string): Promise<Requisition> {
    return this.get(`/requisitions/${requisitionId}/`)
  }

  async getAccountDetails(accountId: string): Promise<AccountDetails> {
    return this.get(`/accounts/${accountId}/details/`)
  }

  async getAccountBalances(accountId: string): Promise<GCBalance> {
    return this.get(`/accounts/${accountId}/balances/`)
  }

  async getAccountTransactions(accountId: string): Promise<TransactionsResponse> {
    return this.get(`/accounts/${accountId}/transactions/`)
  }

  private async get<T>(path: string): Promise<T> {
    if (!this.accessToken) await this.authenticate()

    const res = await fetch(`${GC_BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        accept: 'application/json',
      },
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GoCardless API error: ${res.status} ${text}`)
    }

    return res.json()
  }

  private async post<T>(path: string, body: Record<string, unknown>): Promise<T> {
    if (!this.accessToken) await this.authenticate()

    const res = await fetch(`${GC_BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GoCardless API error: ${res.status} ${text}`)
    }

    return res.json()
  }
}
