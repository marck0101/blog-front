import Header from '../components/Header'

export default function BlogLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  )
}