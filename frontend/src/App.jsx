import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import { ToastContainer } from "react-toastify";
import Register from "./pages/Register";
import PrivateRoute from "./routes/PrivateRoute";
import PublicRoute from "./routes/PublicRoute";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import DashAuditoria from "./pages/DashAuditoria";
import BaseConhecimento from "./pages/BaseConhecimento";
import { useAppContext } from "./contexts/AppContext";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";
{/*import Macroprocessos from "./pages/auditoria/Macroprocesso"; // Ajuste o caminho conforme necessário*/}
{/*import Origem from "./pages/auditoria/Origem"; // Ajuste o caminho conforme necessário*/}
import Unidade from './pages/Unidade';
import Gerencia from './pages/Gerencia';
import Pessoa from './pages/Pessoa';
import PaginaGenericaCrud from "./pages/PaginaGenericaCrud";
{/*import AuditWorkflow from './pages/AuditWorkflow';*/}
import RelatorioPreliminar from "./pages/RelatorioPreliminar";
import RelatorioFinal from "./pages/RelatorioFinal";
import ReuniaoBuscaConjunta from "./pages/ReuniaoBuscaConjunta";
import ReuniaoBuscaConjuntaList from "./pages/ReuniaoBuscaConjuntaList";
import RelatorioFinalList from "./pages/RelatorioFinalList";
import ItemTrabalho from "./pages/ItemTrabalho";
import ItemTrabalhoList from "./pages/ItemTrabalhoList";
import RelatorioPreliminarList from "./pages/RelatorioPreliminarList";
import OrdemServico from "./pages/OrdemServico";
import OrdemServicoList from "./pages/OrdemServicoList";
import Comunicacao from "./pages/Comunicacao";
import ComunicacaoList from "./pages/ComunicacaoList";
import Solicitacao from "./pages/Solicitacao";
import SolicitacaoList from "./pages/SolicitacaoList";
import Nota from "./pages/Nota";
import NotaList from "./pages/NotaList";
import NotaPreliminar from "./pages/NotaPreliminar";
import NotaPreliminarList from "./pages/NotaPreliminarList";
import NotaFinal from "./pages/NotaFinal";
import NotaFinalList from "./pages/NotaFinalList";
import NotaTecnica from "./pages/NotaTecnica";
import NotaTecnicaList from "./pages/NotaTecnicaList";
import Parecer from "./pages/Parecer";
import ParecerList from "./pages/ParecerList";
import Planejamento from "./pages/Planejamento";
import PlanejamentoList from "./pages/PlanejamentoList";
import MatrizAchados from "./pages/MatrizAchados";

const App = () => {

  const { accessToken } = useAppContext();
  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <Navigate to="/login" replace />
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        {/*<Route
          path="/dashboard"
          element={
             <PrivateRoute role={['SISTEMA', 'GESTOR']}>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />*/}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/base-conhecimento"
          element={
            <PrivateRoute>
              <Layout>
                <BaseConhecimento />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dash-auditoria"
          element={
            <PrivateRoute>
              <Layout>
                <DashAuditoria />
              </Layout>
            </PrivateRoute>
          }
        />

        {/*<Route
        path="/auditoria/macroprocesso"
        element={
          <PrivateRoute>
            <Layout>
              <Macroprocessos />
            </Layout>
          </PrivateRoute>
        }
        />*/}

        
        {/*<Route
        path="/auditoria/origem-da-demanda"
        element={
          <PrivateRoute>
            <Layout>
              <Origem />
            </Layout>
          </PrivateRoute>
        }
        />*/}


      <Route
        path="/unidade"
        element={
          <PrivateRoute role={['SISTEMA', 'GESTOR']}>
            <Layout>
              <Unidade />
            </Layout>
          </PrivateRoute>
        }
        />

        <Route
        path="/gerencia"
        element={
          <PrivateRoute role={['SISTEMA', 'GESTOR']}>
            <Layout>
              <Gerencia />
            </Layout>
          </PrivateRoute>
        }
        />

      <Route
        path="/pessoa"
        element={
          <PrivateRoute role={['SISTEMA', 'GESTOR']}>
            <Layout>
              <Pessoa />
            </Layout>
          </PrivateRoute>
        }
        />

        {/*<Route
        path="/auditWorkflow"
        element={
          <PrivateRoute>
            <Layout>
              <AuditWorkflow />
            </Layout>
          </PrivateRoute>
        }
        />*/}


      <Route
        path="/RelatorioPreliminar"
        element={
          <PrivateRoute>
            <Layout>
              <RelatorioPreliminar />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/RelatorioPreliminar/:id"
        element={
          <PrivateRoute>
            <Layout>
              <RelatorioPreliminar />
            </Layout>
          </PrivateRoute>
        }
        />
        
      <Route
        path="/relatorios-preliminar"
        element={
          <PrivateRoute>
            <Layout>
              <RelatorioPreliminarList />
            </Layout>
          </PrivateRoute>
        }
        />

      <Route
        path="/relatorios-finais"
        element={
          <PrivateRoute>
            <Layout>
              <RelatorioFinalList />
            </Layout>
          </PrivateRoute>
        }
        />
        
      <Route
        path="/reunioes-busca-conjunta"
        element={
          <PrivateRoute>
            <Layout>
              <ReuniaoBuscaConjuntaList />
            </Layout>
          </PrivateRoute>
        }
        />
        
      <Route
        path="/ItemTrabalho"
        element={
          <PrivateRoute>
            <Layout>
              <ItemTrabalho />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/itens-trabalho"
        element={
          <PrivateRoute>
            <Layout>
              <ItemTrabalhoList />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/ItemTrabalho/:id"
        element={
          <PrivateRoute>
            <Layout>
              <ItemTrabalho />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/ordem-servico"
        element={
          <PrivateRoute>
            <Layout>
              <OrdemServico />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/ordens-servico"
        element={
          <PrivateRoute>
            <Layout>
              <OrdemServicoList />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/ordem-servico/:id"
        element={
          <PrivateRoute>
            <Layout>
              <OrdemServico />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/comunicacoes"
        element={
          <PrivateRoute>
            <Layout>
              <ComunicacaoList />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/comunicacao"
        element={
          <PrivateRoute>
            <Layout>
              <Comunicacao />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/comunicacao/:id"
        element={
          <PrivateRoute>
            <Layout>
              <Comunicacao />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/solicitacoes"
        element={
          <PrivateRoute>
            <Layout>
              <SolicitacaoList />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/solicitacao"
        element={
          <PrivateRoute>
            <Layout>
              <Solicitacao />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/solicitacao/:id"
        element={
          <PrivateRoute>
            <Layout>
              <Solicitacao />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/notas"
        element={
          <PrivateRoute>
            <Layout>
              <NotaList />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/nota"
        element={
          <PrivateRoute>
            <Layout>
              <Nota />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/nota/:id"
        element={
          <PrivateRoute>
            <Layout>
              <Nota />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/notas-preliminar"
        element={
          <PrivateRoute>
            <Layout>
              <NotaPreliminarList />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/nota-preliminar"
        element={
          <PrivateRoute>
            <Layout>
              <NotaPreliminar />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/nota-preliminar/:id"
        element={
          <PrivateRoute>
            <Layout>
              <NotaPreliminar />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/notas-finais"
        element={
          <PrivateRoute>
            <Layout>
              <NotaFinalList />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/nota-final"
        element={
          <PrivateRoute>
            <Layout>
              <NotaFinal />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/nota-final/:id"
        element={
          <PrivateRoute>
            <Layout>
              <NotaFinal />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/notas-tecnicas"
        element={
          <PrivateRoute>
            <Layout>
              <NotaTecnicaList />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/nota-tecnica"
        element={
          <PrivateRoute>
            <Layout>
              <NotaTecnica />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/nota-tecnica/:id"
        element={
          <PrivateRoute>
            <Layout>
              <NotaTecnica />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/pareceres"
        element={
          <PrivateRoute>
            <Layout>
              <ParecerList />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/parecer"
        element={
          <PrivateRoute>
            <Layout>
              <Parecer />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/parecer/:id"
        element={
          <PrivateRoute>
            <Layout>
              <Parecer />
            </Layout>
          </PrivateRoute>
        }
        />
      <Route
        path="/pareceres/:id"
        element={
          <PrivateRoute>
            <Layout>
              <Parecer />
            </Layout>
          </PrivateRoute>
        }
        />

      {/* Rotas de Criação de Documentos via Fluxo (/novo e variações) */}
      <Route path="/ordens-servico/novo" element={<PrivateRoute><Layout><OrdemServico /></Layout></PrivateRoute>} />
      <Route path="/comunicacoes/novo" element={<PrivateRoute><Layout><Comunicacao /></Layout></PrivateRoute>} />
      <Route path="/solicitacoes/novo" element={<PrivateRoute><Layout><Solicitacao /></Layout></PrivateRoute>} />
      <Route path="/notas-preliminar/novo" element={<PrivateRoute><Layout><NotaPreliminar /></Layout></PrivateRoute>} />
      <Route path="/notas-final/novo" element={<PrivateRoute><Layout><NotaFinal /></Layout></PrivateRoute>} />
      <Route path="/notas/novo" element={<PrivateRoute><Layout><Nota /></Layout></PrivateRoute>} />
      <Route path="/notas-tecnica/novo" element={<PrivateRoute><Layout><NotaTecnica /></Layout></PrivateRoute>} />
      <Route path="/notas-tecnicas/novo" element={<PrivateRoute><Layout><NotaTecnica /></Layout></PrivateRoute>} />
      <Route path="/pareceres/novo" element={<PrivateRoute><Layout><Parecer /></Layout></PrivateRoute>} />
      <Route path="/relatorios-preliminar/novo" element={<PrivateRoute><Layout><RelatorioPreliminar /></Layout></PrivateRoute>} />
      <Route path="/relatorios-final/novo" element={<PrivateRoute><Layout><RelatorioFinal /></Layout></PrivateRoute>} />
      <Route path="/relatorio-final" element={<PrivateRoute><Layout><RelatorioFinal /></Layout></PrivateRoute>} />
      <Route path="/relatorio-final/:id" element={<PrivateRoute><Layout><RelatorioFinal /></Layout></PrivateRoute>} />
      <Route path="/relatorio-preliminar" element={<PrivateRoute><Layout><RelatorioPreliminar /></Layout></PrivateRoute>} />
      <Route path="/relatorio-preliminar/:id" element={<PrivateRoute><Layout><RelatorioPreliminar /></Layout></PrivateRoute>} />
      <Route path="/relatorios-preliminar/:id" element={<PrivateRoute><Layout><RelatorioPreliminar /></Layout></PrivateRoute>} />
      <Route path="/reunioes/novo" element={<PrivateRoute><Layout><PaginaGenericaCrud /></Layout></PrivateRoute>} />
      <Route path="/visitas/novo" element={<PrivateRoute><Layout><PaginaGenericaCrud /></Layout></PrivateRoute>} />
      <Route path="/planejamento" element={<PrivateRoute><Layout><Planejamento /></Layout></PrivateRoute>} />
      <Route path="/planejamento/:id" element={<PrivateRoute><Layout><Planejamento /></Layout></PrivateRoute>} />
      <Route path="/planejamentos" element={<PrivateRoute><Layout><PlanejamentoList /></Layout></PrivateRoute>} />
      <Route path="/planejamentos/:id" element={<PrivateRoute><Layout><Planejamento /></Layout></PrivateRoute>} />
      <Route path="/planejamentos/novo" element={<PrivateRoute><Layout><Planejamento /></Layout></PrivateRoute>} />
      <Route path="/matriz-achados" element={<PrivateRoute><Layout><MatrizAchados /></Layout></PrivateRoute>} />
      <Route path="/matriz-achados/:id" element={<PrivateRoute><Layout><MatrizAchados /></Layout></PrivateRoute>} />
      <Route path="/matrizes-achados/novo" element={<PrivateRoute><Layout><MatrizAchados /></Layout></PrivateRoute>} />
      <Route path="/matrizes-achados/:id" element={<PrivateRoute><Layout><MatrizAchados /></Layout></PrivateRoute>} />
      <Route path="/reunioes-busca-conjunta/novo" element={<PrivateRoute><Layout><ReuniaoBuscaConjunta /></Layout></PrivateRoute>} />
      <Route path="/reunioes-busca-conjunta/:id" element={<PrivateRoute><Layout><ReuniaoBuscaConjunta /></Layout></PrivateRoute>} />
      <Route path="/planos-acao-final/novo" element={<PrivateRoute><Layout><PaginaGenericaCrud /></Layout></PrivateRoute>} />

      <Route
        path="/:entidade"
        element={
          <PrivateRoute>
            <Layout>
              <PaginaGenericaCrud />
            </Layout>
          </PrivateRoute>
        }
      />


        <Route path="*" element={<NotFound />} />
        
      </Routes>

      <ToastContainer />
    </>
  );
};

export default App;
