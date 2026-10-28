import { useLocation } from "react-router-dom";

const ProductDetails = () => {
  const location = useLocation();
  const { product } = location.state;
  console.log(product);
  return(
    <div className="container">
        <div>
            <img src="" alt="" />
        </div>
        <div>

        </div>
    </div>
  )
};

export default ProductDetails;
