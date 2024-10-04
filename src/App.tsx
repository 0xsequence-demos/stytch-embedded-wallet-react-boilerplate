import { useStytch, useStytchUser } from "@stytch/react";
import "./App.css";
import { StytchLogin } from "@stytch/react";
import { Products } from "@stytch/vanilla-js";
import cookies from "browser-cookies";
import { useEffect, useState } from "react";
import { sequenceWaas } from "./SequenceEmbeddedWallet";

const styles = {
  container: {
    width: "100%",
  },
  buttons: {
    primary: {
      backgroundColor: "#4411E1",
    },
  },
};

function getDomainAndPort(url: string) {
  try {
    const parsedUrl = new URL(url);
    const domain = parsedUrl.hostname;
    const port = parsedUrl.port;
    return port
      ? `${parsedUrl.protocol}//${domain}:${port}`
      : `${parsedUrl.protocol}//${domain}`;
  } catch (error) {
    console.error("Invalid URL:", error);
    return null; // Return null for invalid URLs
  }
}

function App() {
  const stytch = useStytch();

  const { user } = useStytchUser();
  const [embeddedWalletAddress, setEmbeddedWalletAddress] = useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const url = window.location.origin;

  const config = {
    products: [Products.emailMagicLinks],
    emailMagicLinksOptions: {
      loginRedirectURL: `${url}/authenticate`,
      loginExpirationMinutes: 60,
      signupRedirectURL: `${url}/authenticate`,
      signupExpirationMinutes: 60,
    },
  };

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token")!;

    setTimeout(async () => {
      if (token && !user) {
        await stytch.magicLinks.authenticate(token, {
          session_duration_minutes: 60,
        });
        const url = window.location.href;
        const baseUrl = getDomainAndPort(url);

        if (baseUrl) {
          window.location.href = baseUrl; // This will change the browser's URL
        }
      }

      if (user) {
        const idToken = cookies.get("stytch_session_jwt")!;
        try {
          const res = await sequenceWaas.signIn({ idToken }, "Stych Token");
          setEmbeddedWalletAddress(res.wallet);
        } catch (err: unknown) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((err as any).status == 400) {
            setErrorMessage("User must sign in again with new magic link");
          }
        }
      }
    }, 0);
  }, []);

  useEffect(() => {}, [embeddedWalletAddress]);

  const signOut = async () => {
    try {
      const sessions = await sequenceWaas.listSessions();
      await sequenceWaas.dropSession({ sessionId: sessions[0].id });
    } catch (err) {
      console.log(err);
    }

    stytch.session.revoke();
    setErrorMessage(null);
  };

  return (
    <>
      <h1>Embedded Wallet Stytch Auth</h1>
      {errorMessage}
      {user && (
        <button className="sign-out" onClick={() => signOut()}>
          Log out
        </button>
      )}
      {!user ? (
        <StytchLogin config={config} styles={styles} />
      ) : (
        <p>{embeddedWalletAddress}</p>
      )}
    </>
  );
}

export default App;
