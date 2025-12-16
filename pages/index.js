import Head from "next/head";
import Image from "next/image";
import styles from "@/styles/Home.module.css";

export default function Home() {
  return (
    <>
      <Head>
        <title>API Running</title>
        <meta name="description" content="API Server Live" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.page}>
        <main className={styles.main}>
          <h1>✅ API is running</h1>
          <p>Edit <code>pages/api</code> to use the backend.</p>
        </main>
      </div>
    </>
  );
}
