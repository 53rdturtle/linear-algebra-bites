// Section 4.1, following the book's order: pp. 194–205.
import { useState } from 'react'
import { M, MB } from '../components/Tex.jsx'
import { dot, rank } from '../lib/linalg.js'
import { Boxed, Example, FlipCard, More, Part, Steps, Toy, Try, VectorAnswer } from './ui.jsx'
import {
  BigPictureToy,
  ColumnsTimesY,
  CountToy,
  Figure44,
  FredholmToy,
  PythagorasToy,
  RowsTimesX,
  SplitToy,
  SubmatrixToy,
  WallsToy,
} from './toys.jsx'

const nonzero = (v) => v.some((t) => t !== 0)
const isMultiple = (v, d) => nonzero(v) && rank([v, d]) === 1

function P21() {
  const S = [
    [1, 2, 2, 3],
    [1, 3, 3, 2],
  ]
  const [first, setFirst] = useState(null)
  const inPerp = (v) => (!nonzero(v) ? 'Must be nonzero.' : S.every((s) => dot(s, v) === 0) ? true : `Dot products with the two vectors: ${S.map((s) => dot(s, v)).join(', ')}. Both must be 0.`)
  return (
    <>
      <div className="small">First vector in S⊥:</div>
      <VectorAnswer n={4} check={inPerp} onCorrect={setFirst} />
      {first && (
        <>
          <div className="small">A second one, not a multiple of the first:</div>
          <VectorAnswer n={4} check={(v) => { const r = inPerp(v); return r !== true ? r : rank([first, v]) === 2 ? true : 'That is a multiple of your first vector.' }} />
        </>
      )}
    </>
  )
}

function BPlane() {
  const [first, setFirst] = useState(null)
  const onPlane = (v) => (!nonzero(v) ? 'Must be nonzero.' : v[0] - 3 * v[1] - 4 * v[2] === 0 ? true : `x − 3y − 4z = ${v[0] - 3 * v[1] - 4 * v[2]}, not 0.`)
  return (
    <>
      <VectorAnswer n={3} labels={['x', 'y', 'z']} check={onPlane} onCorrect={setFirst} />
      {first && (
        <VectorAnswer n={3} labels={['x', 'y', 'z']} check={(v) => { const r = onPlane(v); return r !== true ? r : rank([first, v]) === 2 ? true : 'Same direction as the first one.' }} />
      )}
    </>
  )
}

export const section = {
  num: '4.1',
  title: 'Orthogonality of the Four Subspaces',
  pages: '194–205',
  parts: [
    { id: 'orthogonal-vectors', title: 'Orthogonal vectors' },
    { id: 'orthogonal-subspaces', title: 'Orthogonal subspaces' },
    { id: 'row-null', title: 'Row space ⟂ nullspace' },
    { id: 'left-null', title: 'Column space ⟂ left nullspace' },
    { id: 'big-picture', title: 'The big picture' },
    { id: 'complements', title: 'Orthogonal complements' },
    { id: 'split', title: 'What A does to x' },
    { id: 'drawing', title: 'Drawing the big picture' },
    { id: 'bases', title: 'Combining bases' },
    { id: 'review', title: 'Review of the key ideas' },
    { id: 'worked', title: 'Worked examples' },
    { id: 'problems', title: 'Problem set (selected)' },
  ],
}

export function Section41() {
  return (
    <article className="book-section">
      <header className="section-header">
        <div className="chapter-kicker">Chapter 4 · Orthogonality</div>
        <h1>4.1 Orthogonality of the Four Subspaces</h1>
        <ol className="key-points">
          <li>Orthogonal vectors have <M>{'v^Tw=0'}</M>. Then <M>{'\\|v\\|^2+\\|w\\|^2=\\|v+w\\|^2'}</M>.</li>
          <li>Subspaces V and W are orthogonal when <M>{'v^Tw=0'}</M> for every v in V and w in W.</li>
          <li>The row space is orthogonal to the nullspace. The column space is orthogonal to <M>{'N(A^T)'}</M>.</li>
          <li>The dimensions add up: <M>{'r+(n-r)=n'}</M> and <M>{'r+(m-r)=m'}</M>.</li>
          <li>Row space and nullspace are orthogonal complements: every x splits into <M>{'x_r+x_n'}</M>.</li>
          <li>If d vectors in a d-dimensional space are independent, they span it, and vice versa.</li>
        </ol>
      </header>

      <Part id="orthogonal-vectors" title="Orthogonal vectors" page={194}>
        <p>
          Two vectors are orthogonal when their dot product is zero: <M>{'v \\cdot w = v^Tw = 0'}</M>. Think of{' '}
          <M>{'a^2+b^2=c^2'}</M> for a right triangle with sides v and w.
        </p>
        <Toy caption="Drag v and w. Watch Pythagoras turn on.">
          <PythagorasToy />
        </Toy>
        <p>
          Why: <M>{'\\|v+w\\|^2=(v+w)^T(v+w)=v^Tv+2v^Tw+w^Tw'}</M>. The middle term is zero exactly when v ⟂ w.
        </p>
        <Try q={{ id: 'b41-1', type: 'number', prompt: <>Which c makes <M>{'(1,2,3)\\perp(3,0,c)'}</M>?</>, answer: -1, hint: '3 + 0 + 3c = 0', explain: 'c = −1' }} />
      </Part>

      <Part id="orthogonal-subspaces" title="Orthogonal subspaces" page={195}>
        <Boxed label="Definition">
          Subspaces V and W are <b>orthogonal</b> if every vector v in V is perpendicular to every vector w in W:{' '}
          <M>{'v^Tw = 0'}</M> for all v and w.
        </Boxed>
        <Example n={1}>The floor of your room (extended to infinity) and the line where two walls meet are orthogonal.</Example>
        <Example n={2}>Two walls look perpendicular, but as subspaces they are <b>not</b> orthogonal.</Example>
        <Toy caption="Examples 1 and 2 (Figure 4.1). Drag to rotate.">
          <WallsToy />
        </Toy>
        <p>
          A vector in two orthogonal subspaces is perpendicular to itself, <M>{'v^Tv=0'}</M>, so it must be zero. That makes
          orthogonality impossible when <M>{'\\dim V+\\dim W > n'}</M>.
        </p>
        <Try q={{ id: 'b41-2', type: 'choice', prompt: <>Can two planes in <M>{'\\mathbf{R}^4'}</M> be orthogonal subspaces?</>, options: ['Yes', 'No'], answer: 0, explain: '2 + 2 = 4 is not more than 4. The x₁x₂-plane and the x₃x₄-plane work.' }} />
      </Part>

      <Part id="row-null" title="The nullspace is orthogonal to the row space" page="195–196">
        <p>
          <b>Every x in the nullspace is perpendicular to every row of A</b>, because Ax = 0. Read Ax = 0 one row at a time:
        </p>
        <MB>{'Ax=\\begin{bmatrix}\\text{row }1\\\\ \\vdots \\\\ \\text{row }m\\end{bmatrix}x=\\begin{bmatrix}0\\\\ \\vdots\\\\ 0\\end{bmatrix}\\qquad(1)'}</MB>
        <p>Then x is perpendicular to every combination of the rows too: the whole row space.</p>
        <Example n={3}>The rows of A are perpendicular to x = (1, 1, −1) in the nullspace. Find it yourself:</Example>
        <Toy caption="Equation (1) with Example 3's matrix.">
          <RowsTimesX
            A={[
              [1, 3, 4],
              [5, 2, 7],
            ]}
          />
        </Toy>
        <More label="Second proof, in matrix shorthand (2)">
          Row space vectors are <M>{'A^Ty'}</M>. For x in the nullspace: <M>{'x^T(A^Ty)=(Ax)^Ty=0^Ty=0'}</M>.
        </More>
      </Part>

      <Part id="left-null" title="The column space is orthogonal to the left nullspace" page={196}>
        <p>
          Apply the same idea to <M>{'A^T'}</M>. If <M>{'A^Ty=0'}</M>, each column of A times y gives zero:
        </p>
        <MB>{'A^Ty=\\begin{bmatrix}(\\text{column }1)^T\\\\ \\vdots\\\\ (\\text{column }n)^T\\end{bmatrix}y=\\begin{bmatrix}0\\\\ \\vdots\\\\ 0\\end{bmatrix}\\qquad(3)'}</MB>
        <Toy caption="Equation (3). y lives in Rᵐ.">
          <ColumnsTimesY
            A={[
              [1, 0],
              [2, 1],
              [3, 1],
            ]}
          />
        </Toy>
        <Boxed>
          The left nullspace <M>{'N(A^T)'}</M> and the column space <M>{'C(A)'}</M> are orthogonal in <M>{'\\mathbf{R}^m'}</M>.
        </Boxed>
      </Part>

      <Part id="big-picture" title="The big picture" page={197}>
        <p>Two pairs of orthogonal subspaces: two in <M>{'\\mathbf{R}^n'}</M>, two in <M>{'\\mathbf{R}^m'}</M>. Change A and watch the sizes.</p>
        <Toy caption="Figure 4.2, live.">
          <BigPictureToy />
        </Toy>
      </Part>

      <Part id="complements" title="Orthogonal complements" page="197–198">
        <p>
          The dimensions are also right. Two perpendicular lines in <M>{'\\mathbf{R}^3'}</M> cannot be the row space and
          nullspace of a 3 by 3 matrix: 1 + 1 ≠ 3.
        </p>
        <Boxed label="Definition">
          The <b>orthogonal complement</b> <M>{'V^\\perp'}</M> contains <i>every</i> vector perpendicular to V.
        </Boxed>
        <More label="Why the nullspace is all of (row space)⊥">
          If v were perpendicular to the nullspace but not in the row space, add v as an extra row. The nullspace stays the same
          but the row space grows, breaking <M>{'r+(n-r)=n'}</M>.
        </More>
        <Boxed label="Fundamental Theorem of Linear Algebra, Part 2">
          <M>{'N(A)'}</M> is the orthogonal complement of the row space <M>{'C(A^T)'}</M> (in <M>{'\\mathbf{R}^n'}</M>).
          <br />
          <M>{'N(A^T)'}</M> is the orthogonal complement of the column space <M>{'C(A)'}</M> (in <M>{'\\mathbf{R}^m'}</M>).
        </Boxed>
        <Try q={{ id: 'b41-3', type: 'choice', prompt: <>The fundamental subspaces of a 3 by 3 matrix have dimensions…</>, options: ['2 and 1, or 3 and 0', '1 and 1', 'any pair'], answer: 0, explain: 'They must add to n = 3 (and 1 + 2 or 0 + 3 the other way round).' }} />
      </Part>

      <Part id="split" title="What A does to every x" page="198–200">
        <p>
          Every x splits into a row space part and a nullspace part, <M>{'x=x_r+x_n'}</M>. Then{' '}
          <M>{'Ax_n=0'}</M> and <M>{'Ax_r=Ax'}</M>. Every vector goes to the column space.
        </p>
        <Toy caption="Figure 4.3 with Example 5: (4, 3) = (2, 4) + (2, −1).">
          <SplitToy />
        </Toy>
        <p>
          Every b in the column space comes from <b>one and only one</b> <M>{'x_r'}</M>. From row space to column space, A is
          invertible.
        </p>
        <More>
          If <M>{"Ax_r=Ax_r'"}</M>, the difference <M>{"x_r-x_r'"}</M> is in the nullspace and in the row space. Those are
          perpendicular, so the difference is zero.
        </More>
        <Example n={4}>Every matrix of rank r has an r by r invertible submatrix, in the pivot rows and columns.</Example>
        <Toy caption="Example 4. Edit the matrix.">
          <SubmatrixToy />
        </Toy>
        <p className="small muted">This hidden invertible part is what the SVD (7.1) and the pseudoinverse (7.4) work with.</p>
      </Part>

      <Part id="drawing" title="Drawing the big picture" page={199}>
        <p>Strang: "I don't know the best way to draw the four subspaces." One way is a line meeting a plane:</p>
        <Toy caption="Figure 4.4: row space = plane, nullspace = orthogonal line.">
          <Figure44 />
        </Toy>
        <p className="small muted">His open question: how to draw two orthogonal planes in R⁴? Good ideas are welcome.</p>
      </Part>

      <Part id="bases" title="Combining bases from subspaces" page={200}>
        <Boxed>
          Any n independent vectors in <M>{'\\mathbf{R}^n'}</M> must span <M>{'\\mathbf{R}^n'}</M>. Any n vectors that span{' '}
          <M>{'\\mathbf{R}^n'}</M> must be independent.
        </Boxed>
        <Toy caption="With the right count, one property brings the other.">
          <CountToy />
        </Toy>
        <p>
          For a square matrix: uniqueness implies existence, and existence implies uniqueness. Bases for the row space (r) and
          nullspace (n − r) together give n independent vectors, so every x in <M>{'\\mathbf{R}^n'}</M> is some{' '}
          <M>{'x_r+x_n'}</M>.
        </p>
        <Try q={{ id: 'b41-4', type: 'choice', prompt: 'A is 5 by 5 and Ax = 0 has only x = 0. Is Ax = b solvable for every b?', options: ['Yes', 'No'], answer: 0, explain: 'Five independent columns in R⁵ must span R⁵.' }} />
      </Part>

      <Part id="review" title="Review of the key ideas" page={201}>
        <div className="flip-grid">
          <FlipCard front="When are subspaces V and W orthogonal?" back="When every v in V is orthogonal to every w in W." />
          <FlipCard front="What makes V and W orthogonal complements?" back="W contains ALL vectors perpendicular to V (and vice versa). In Rⁿ their dimensions add to n." />
          <FlipCard front="Which subspaces are complements, and in which space?" back="N(A) and C(Aᵀ) in Rⁿ: (n − r) + r = n. N(Aᵀ) and C(A) in Rᵐ: (m − r) + r = m." />
          <FlipCard front="n independent vectors in Rⁿ…" back="…span Rⁿ. And n spanning vectors are independent." />
        </div>
      </Part>

      <Part id="worked" title="Worked examples" page={201}>
        <h3>4.1 A</h3>
        <p>S is a six-dimensional subspace of nine-dimensional space <M>{'\\mathbf{R}^9'}</M>.</p>
        <Steps
          items={[
            { prompt: '(a) What are the possible dimensions of subspaces orthogonal to S?', q: { id: 'b41-A-a', type: 'choice', options: ['0, 1, 2, 3', 'only 3', '0 to 9'], answer: 0 } },
            { prompt: '(b) What is the dimension of the orthogonal complement S⊥?', q: { id: 'b41-A-b', type: 'number', answer: 3, explain: 'S⊥ is the largest orthogonal subspace.' } },
            { prompt: '(c) The smallest matrix A with row space S has how many rows?', q: { id: 'b41-A-c', type: 'number', answer: 6, explain: 'A is 6 by 9: its six rows are a basis for S.' } },
            { prompt: '(d) The smallest matrix B with nullspace S⊥?', answer: 'The same question as (c)! Nullspace S⊥ means row space S: 6 by 9.' },
          ]}
        />
        <h3>4.1 B</h3>
        <p>
          The equation <M>{'x-3y-4z=0'}</M> describes a plane P in <M>{'\\mathbf{R}^3'}</M>.
        </p>
        <Steps
          items={[
            { prompt: '(a) P is the nullspace of which 1 by 3 matrix?', q: { id: 'b41-B-a', type: 'choice', options: ['[1 −3 −4]', '[1 3 4]', '[3 1 0]'], answer: 0 } },
            { prompt: '(b) Find two independent vectors in P (special solutions):', answer: <BPlane /> },
            { prompt: '(c) A basis for the line P⊥:', answer: <VectorAnswer n={3} check={(v) => (isMultiple(v, [1, -3, -4]) ? true : 'It must be perpendicular to every vector in P.')} /> },
          ]}
        />
      </Part>

      <Part id="problems" title="Problem set 4.1 (selected)" page="202–205">
        <p className="small muted">Work on paper, check here. Problem numbers match the book.</p>

        <div className="problem">
          <span className="pnum">5</span>
          <Try q={{ id: 'b41-p5', type: 'choice', prompt: <>(a) If <M>{'Ax=b'}</M> has a solution and <M>{'A^Ty=0'}</M>, which is zero?</>, options: [<M key="a">{'y^Tx'}</M>, <M key="b">{'y^Tb'}</M>], answer: 1, explain: 'b is in C(A), y is in N(Aᵀ), and those are orthogonal.' }} />
        </div>

        <div className="problem">
          <span className="pnum">6</span>
          <p>This system has no solution. Find <M>{'y_1,y_2,y_3'}</M> that make the equations add to 0 = 1.</p>
          <FredholmToy
            A={[
              [1, 2, 2],
              [2, 2, 3],
              [3, 4, 5],
            ]}
            b={[5, 5, 9]}
          />
        </div>

        <div className="problem">
          <span className="pnum">7</span>
          <p>Same game (Fredholm's Alternative): <M>{'x_1-x_2=1,\\ x_2-x_3=1,\\ x_1-x_3=1'}</M>.</p>
          <FredholmToy
            A={[
              [1, -1, 0],
              [0, 1, -1],
              [1, 0, -1],
            ]}
            b={[1, 1, 1]}
            names={['x₁', 'x₂', 'x₃']}
          />
        </div>

        <div className="problem">
          <span className="pnum">9</span>
          <Try q={{ id: 'b41-p9', type: 'choice', prompt: <>If <M>{'A^TAx=0'}</M> then <M>{'Ax=0'}</M>. Reason: Ax is in the nullspace of <M>{'A^T'}</M> and also in the ___ of A, and those spaces are orthogonal.</>, options: ['column space', 'row space', 'nullspace'], answer: 0, explain: 'Ax is in C(A) ∩ N(Aᵀ) = {0}. So AᵀA has the same nullspace as A. You will need this in 4.2!' }} />
        </div>

        <div className="problem">
          <span className="pnum">17</span>
          <Try q={{ id: 'b41-p17', type: 'choice', prompt: <>If S is spanned by (1, 1, 1), what is <M>{'S^\\perp'}</M>?</>, options: ['the plane x + y + z = 0', 'the line through (1, −1, 0)', 'all of R³'], answer: 0 }} />
        </div>

        <div className="problem">
          <span className="pnum">21</span>
          <p>S is spanned by (1, 2, 2, 3) and (1, 3, 3, 2). Find two vectors that span <M>{'S^\\perp'}</M>.</p>
          <P21 />
        </div>

        <div className="problem">
          <span className="pnum">22</span>
          <p>
            P is the plane of vectors in <M>{'\\mathbf{R}^4'}</M> with <M>{'x_1+x_2+x_3+x_4=0'}</M>. Write a basis for{' '}
            <M>{'P^\\perp'}</M>.
          </p>
          <VectorAnswer n={4} check={(v) => (isMultiple(v, [1, 1, 1, 1]) ? true : 'P⊥ is a line. Which vector is perpendicular to the whole plane?')} />
        </div>

        <div className="problem">
          <span className="pnum">28</span>
          <Try q={{ id: 'b41-p28', type: 'choice', prompt: '(a) (1, 1, 1) ⟂ (1, 1, −2), so the planes x + y + z = 0 and x + y − 2z = 0 are orthogonal. Why is this false?', options: ['The normal vectors being perpendicular does not make the planes orthogonal: two planes in R³ always share a line', 'The vectors are not actually perpendicular', 'It is true'], answer: 0 }} />
        </div>
        <p className="small muted">More in the book: 3, 11 (recommended), 14–15, 19–20, 24, 30.</p>
      </Part>
    </article>
  )
}
