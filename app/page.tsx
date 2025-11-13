import ReelDownloader from "../components/ReelDownloader";

export default function Page() {
  return (
    <main className="app-shell">
      <section className="hero">
        <h1>ReelFetch - Instagram Reel डाउनलोडर</h1>
        <p>
          बस अपनी मनपसंद रील का लिंक पेस्ट करें और कुछ सेकंड में HD वीडियो डाउनलोड करें। कोई लॉगिन नहीं,
          कोई झंझट नहीं!
        </p>
      </section>

      <section className="card">
        <ReelDownloader />
      </section>

      <p className="footer">
        कृपया केवल उन्हीं रील्स को डाउनलोड करें जिनका उपयोग करने का आपके पास अधिकार हो। इंस्टाग्राम की
        <a href="https://help.instagram.com/581066165581870" target="_blank" rel="noreferrer">
          {" "}
          नीतियों
        </a>{" "}
        और स्थानीय कानूनों का सम्मान करें।
      </p>
    </main>
  );
}
