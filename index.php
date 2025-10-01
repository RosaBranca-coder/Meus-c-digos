<?php>
// Conexão com o banco de dados
$servername = "localhost";      
$username = "root";
$password = "";
$dbname = "estoque_rapido";
$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
    die("Conexão falhou: " . $conn->connect_error);
}
// Processar o formulário
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nome = $_POST['nome'];
    $quantidade = $_POST['quantidade'];
    $preco = $_POST['preco'];
    $sql = "INSERT INTO produtos (nome, quantidade, preco) VALUES ('$nome', $quantidade, $preco)";
    if ($conn->query($sql) === TRUE) {
        echo "Produto registrado com sucesso!";
    } else {
        echo "Erro: " . $sql . "<br>" . $conn->error;
    }
}
$conn->close();
</php>