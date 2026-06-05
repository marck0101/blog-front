import BlogLayout from "../../layouts/BlogLayout";
import SEO from "../../components/SEO";

export default function PrivacyPolicy() {

  return (
    <BlogLayout>
      <SEO
        title="Política de Privacidade | marck0101"
        description="Como coletamos, usamos e protegemos seus dados pessoais."
        url="/privacidade"
        robots="noindex"
      />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Política de Privacidade
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-10">
          Última atualização: junho de 2026
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8">

          <section>
            <h2>1. Quem somos</h2>
            <p>
              Este site é operado por <strong>marck0101</strong>, acessível em{" "}
              <strong>blog.marck0101.com.br</strong>. Para dúvidas sobre privacidade,
              entre em contato pelo e-mail:{" "}
              <a href="mailto:marck.mhc@gmail.com">marck.mhc@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2>2. Quais dados coletamos</h2>
            <ul>
              <li>
                <strong>E-mail e nome</strong> — fornecidos voluntariamente ao se
                inscrever na newsletter.
              </li>
              <li>
                <strong>Categorias de interesse</strong> — selecionadas no formulário
                de assinatura.
              </li>
              <li>
                <strong>Cookies de sessão e preferências</strong> — armazenados
                localmente no seu navegador para manter suas configurações (ex: tema
                claro/escuro, aceite de cookies).
              </li>
              <li>
                <strong>Dados de navegação</strong> — coletados anonimamente por
                ferramentas de análise para entender o desempenho do conteúdo.
              </li>
            </ul>
          </section>

          <section>
            <h2>3. Como usamos os dados</h2>
            <ul>
              <li>Enviar comunicações do blog (novos artigos, atualizações).</li>
              <li>Personalizar o conteúdo enviado conforme suas categorias de interesse.</li>
              <li>Melhorar a experiência de navegação no site.</li>
            </ul>
            <p>
              <strong>Não vendemos, alugamos nem compartilhamos</strong> seus dados
              pessoais com terceiros para fins comerciais.
            </p>
          </section>

          <section>
            <h2>4. Por quanto tempo armazenamos</h2>
            <p>
              Seus dados são armazenados enquanto você mantiver a inscrição ativa.
              Após o cancelamento, os dados são marcados como "cancelado" e podem ser
              excluídos permanentemente mediante solicitação.
            </p>
            <p>
              Cookies de preferência são armazenados localmente no seu navegador por
              tempo indeterminado e podem ser removidos a qualquer momento pelas
              configurações do navegador.
            </p>
          </section>

          <section>
            <h2>5. Seus direitos (LGPD)</h2>
            <p>
              Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018),
              você tem direito a:
            </p>
            <ul>
              <li>Confirmar a existência do tratamento dos seus dados.</li>
              <li>Acessar os dados que temos sobre você.</li>
              <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
              <li>Solicitar a exclusão ou anonimização dos seus dados.</li>
              <li>Revogar o consentimento a qualquer momento.</li>
            </ul>
            <p>
              Para exercer esses direitos, entre em contato por e-mail:{" "}
              <a href="mailto:marck.mhc@gmail.com">marck.mhc@gmail.com</a>.
              Responderemos em até 15 dias úteis.
            </p>
          </section>

          <section>
            <h2>6. Como cancelar sua inscrição</h2>
            <p>
              Você pode cancelar sua assinatura da newsletter a qualquer momento:
            </p>
            <ul>
              <li>
                Clicando no link de cancelamento presente em qualquer e-mail que
                enviamos.
              </li>
              <li>
                Enviando uma solicitação para{" "}
                <a href="mailto:marck.mhc@gmail.com">marck.mhc@gmail.com</a> com o
                assunto "Cancelar inscrição".
              </li>
            </ul>
          </section>

          <section>
            <h2>7. Cookies</h2>
            <p>Utilizamos dois tipos de cookies:</p>
            <ul>
              <li>
                <strong>Essenciais</strong> — necessários para o funcionamento básico
                do site (preferências de tema, aceite desta política).
              </li>
              <li>
                <strong>Analíticos</strong> — coletam dados anônimos de navegação para
                melhoria do conteúdo. Você pode recusá-los ao interagir com o banner
                de cookies.
              </li>
            </ul>
            <p>
              Você pode gerenciar ou excluir cookies a qualquer momento pelas
              configurações do seu navegador.
            </p>
          </section>

        </div>
      </main>
    </BlogLayout>
  );
}
