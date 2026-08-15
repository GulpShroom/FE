import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '../../components/AppShell'
import { Modal } from '../../components/Modal'
import { products, resellPosts } from '../../data/mock'

const TONES = ['감성적', '담백하게', '발랄하게']

export default function ResellListPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [scope, setScope] = useState(params.get('manage') === '1' ? 'mine' : 'all')
  const [managing, setManaging] = useState(params.get('manage') === '1')
  const [tone, setTone] = useState('감성적')
  const [deleteId, setDeleteId] = useState(null)
  const [posts, setPosts] = useState(resellPosts)
  const [manageIndex, setManageIndex] = useState(0)

  useEffect(() => {
    if (params.get('manage') === '1') {
      setManaging(true)
      setScope('mine')
    }
  }, [params])

  const list = useMemo(() => {
    return posts.filter((post) => {
      if ((scope === 'mine' || managing) && !post.mine) return false
      return true
    })
  }, [posts, scope, managing])

  const managePost = list[manageIndex] ?? list[0]
  const manageProduct =
    products.find((p) => p.id === managePost?.productId) ?? products[0]

  if (managing) {
    return (
      <AppShell
        showNav={false}
        showBack
        onBack={() => {
          setManaging(false)
          setScope('all')
          navigate('/resell', { replace: true })
        }}
      >
        <div className="page page--resell-manage form-stack">
          <h1 className="resell-create__title">내 리셀글 관리</h1>

          {list.length === 0 ? (
            <div className="resell-empty resell-empty--manage">
              <p className="resell-empty__title">내 리셀글이 없습니다.</p>
            </div>
          ) : (
            <>
              <button
                type="button"
                className="resell-overview"
                onClick={() => navigate(`/resell/${managePost.id}`)}
              >
                <div className="resell-overview__inner">
                  <p className="resell-overview__eyebrow">Journey Overview</p>
                  <p className="resell-overview__alias">
                    {manageProduct?.alias ?? managePost.title}
                  </p>
                  <div className="resell-overview__meta">
                    <span>정품 인증 완료</span>
                    <span>{manageProduct?.journeyCount ?? 0}개의 여정 기록</span>
                  </div>
                  {manageProduct?.stamp ? (
                    <img
                      className="resell-overview__stamp"
                      src={manageProduct.stamp}
                      alt=""
                      width={160}
                      height={160}
                    />
                  ) : null}
                  <p className="resell-overview__score">
                    {manageProduct?.careScore ?? 87}
                  </p>
                </div>
              </button>

              <div className="passport-rail" aria-label="내 리셀글">
                {list.map((p, i) =>
                  i === manageIndex ? (
                    <span
                      key={p.id}
                      className="passport-rail__pill"
                      style={{ background: 'var(--mc-green)' }}
                    />
                  ) : (
                    <button
                      key={p.id}
                      type="button"
                      className="passport-rail__dot"
                      style={{ background: 'var(--mc-green)', border: 0, padding: 0 }}
                      onClick={() => setManageIndex(i)}
                      aria-label={p.title}
                    />
                  ),
                )}
              </div>

              <div className="resell-dual">
                <button
                  type="button"
                  className="resell-dual__btn"
                  onClick={() => setDeleteId(managePost.id)}
                >
                  삭제하기
                </button>
                <button
                  type="button"
                  className="resell-dual__btn"
                  onClick={() => navigate(`/resell/${managePost.id}`)}
                >
                  수정하기
                </button>
              </div>
            </>
          )}
        </div>

        <Modal
          open={Boolean(deleteId)}
          title="이 리셀글을 삭제하시겠습니까?"
          primaryLabel="삭제하기"
          danger
          onPrimary={() => {
            setPosts((prev) => prev.filter((p) => p.id !== deleteId))
            setManageIndex(0)
            setDeleteId(null)
          }}
          onSecondary={() => setDeleteId(null)}
          onClose={() => setDeleteId(null)}
        >
          <p>삭제된 리셀글은 복구할 수 없습니다.</p>
        </Modal>
      </AppShell>
    )
  }

  return (
    <AppShell showTagline>
      <div className="page page--resell">
        <div className="resell-head">
          <h1 className="resell-head__title">Resell</h1>
          <button
            type="button"
            className="resell-head__manage"
            onClick={() => {
              setManaging(true)
              setScope('mine')
              setManageIndex(0)
            }}
          >
            내 리셀글 관리
          </button>
        </div>

        <div className="resell-segmented">
          <button
            type="button"
            className={scope === 'all' ? 'is-active' : ''}
            onClick={() => setScope('all')}
          >
            전체 리셀글
          </button>
          <button
            type="button"
            className={scope === 'mine' ? 'is-active' : ''}
            onClick={() => setScope('mine')}
          >
            내 리셀 내역
          </button>
        </div>

        <div className="resell-tones">
          {TONES.map((t) => (
            <button
              key={t}
              type="button"
              className={`resell-tone${tone === t ? ' is-active' : ''}`}
              onClick={() => setTone(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {list.length === 0 ? (
          <div className="resell-empty">
            <p className="resell-empty__title">내 리셀글이 없습니다.</p>
            <p className="resell-empty__desc">보유 제품으로 리셀글을 등록해 보세요.</p>
          </div>
        ) : (
          <div className="resell-list">
            {list.map((post) => (
              <article key={post.id} className="resell-card">
                <Link to={`/resell/${post.id}`} className="resell-card__link">
                  <div className="resell-card__thumb">
                    <img src={post.image} alt="" width={56} height={56} />
                  </div>
                  <div className="resell-card__copy">
                    <h3 className="resell-card__title">
                      {post.title.replace('\n', ' ')}
                    </h3>
                    <p className="resell-card__price">{post.price}</p>
                  </div>
                </Link>
                <div className="resell-card__meta">
                  <span className="resell-card__status">{post.status}</span>
                  {post.mine ? (
                    <button
                      type="button"
                      className="resell-card__delete"
                      onClick={() => setDeleteId(post.id)}
                    >
                      삭제
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}

        <button
          type="button"
          className="resell-fab"
          aria-label="리셀 등록"
          onClick={() => navigate('/resell/new')}
        >
          +
        </button>
      </div>

      <Modal
        open={Boolean(deleteId)}
        title="이 리셀글을 삭제하시겠습니까?"
        primaryLabel="삭제하기"
        danger
        onPrimary={() => {
          setPosts((prev) => prev.filter((p) => p.id !== deleteId))
          setDeleteId(null)
        }}
        onSecondary={() => setDeleteId(null)}
        onClose={() => setDeleteId(null)}
      >
        <p>삭제된 리셀글은 복구할 수 없습니다.</p>
      </Modal>
    </AppShell>
  )
}
