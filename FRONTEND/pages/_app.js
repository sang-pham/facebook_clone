import 'antd/dist/antd.css'
import '../components/scss/main.scss'
import React, { useState } from 'react'
import Head from 'next/head'
import Router from 'next/router'
import { Provider } from 'react-redux'
import store from '../store'
import Loading from '../components/Loading'

function MyApp({ Component, pageProps }) {
  const [loading, setLoading] = useState(false)

  Router.events.on('routeChangeStart', (url) => {
    setLoading(true)
  })

  Router.events.on('routeChangeComplete', (url) => {
    setLoading(false)
  })

  return (
    <Provider store={store}>
      <Head>
        <link rel="icon" href="/images/facebook.ico" />
      </Head>
      {loading && <Loading />}
      <Component {...pageProps} />
    </Provider>
  )
}

export default MyApp
