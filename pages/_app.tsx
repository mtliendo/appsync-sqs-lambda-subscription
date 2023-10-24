import { awsconfig } from '@/aws_config'
import '@/styles/globals.css'
import { AmplifyProvider } from '@aws-amplify/ui-react'
import { Amplify } from 'aws-amplify'
import type { AppProps } from 'next/app'
Amplify.configure(awsconfig)
export default function App({ Component, pageProps }: AppProps) {
	return (
		<AmplifyProvider>
			<Component {...pageProps} />
		</AmplifyProvider>
	)
}
