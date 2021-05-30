<script>
  console.log("hello create-vc");
    import * as identity from "iota-identity-wasm-test/web/";

  const IOTA_CLIENT_CONFIG = {
    network: "main",
    node: "https://nodes.thetangle.org:443"
  };

  let state = { loading: false };

  async function create_vc() {
    state.loading = !state.loading;
    await identity.init();
    console.log(identity);

    let credentialSubject = {
      id: "0001",
      name: "Alice",
      degree: {
        name: "Credential of a Company",
        type: "CompanyCredential"
      }
    };

    // Issue a signed `CompanyCredential` credential to Alice
    let vc = new identity.VerifiableCredential(
      alice_doc,
      alice_key,
      credentialSubject,
      "CompanyCredential",
      "http://company.com/credentials/1337"
    );

    console.log("Verifiable Credential: ", JSON.stringify(vc));
  }
</script>

<svelte:options tag="create-vc" />
<div>
    <button on:click={create_vc}>Create VC</button>
</div>
